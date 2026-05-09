import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ID, Permission, Role, Query } from 'appwrite';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
const APPWRITE_CHAT_BLOCKS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_CHAT_BLOCKS_COLLECTION_ID || 'chat_blocks';

/** Deterministic password derived from userId — Appwrite REST POST /users requires a password field. */
const buildUserPassword = (userId: string): string => {
  const secret = APPWRITE_API_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(userId).digest('base64').slice(0, 48);
};

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Appwrite-Project': APPWRITE_PROJECT_ID as string,
  'X-Appwrite-Key': APPWRITE_API_KEY as string,
});

const buildStableUserId = (rawIdentity: string) => {
  const digest = crypto.createHash('sha256').update(rawIdentity).digest('hex').slice(0, 28);
  return `tc_${digest}`;
};

const resolveAppwriteIdentity = (session: any): string => {
  const email = String(session?.user?.email || '').trim().toLowerCase();
  if (email) return email;
  const backendUserId = String(session?.user_id || '').trim();
  if (backendUserId) return backendUserId;
  return '';
};

const resolveSenderId = (session: any): number | null => {
  const id = Number(session?.user_id);
  return Number.isFinite(id) ? id : null;
};

export async function POST(request: Request) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    return NextResponse.json(
      { error: 'Missing Appwrite configuration' },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if ((session as any).is_baned || (session as any).banned) {
    return NextResponse.json({ error: 'Your account is banned. Messaging is blocked.' }, { status: 403 });
  }

  const {
    conversationKey,
    content,
    senderType,
    otherUserEmail,
  } = await request.json();

  if (!conversationKey || !content || !senderType) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // Mint a JWT for the server to use with Appwrite
    const rawIdentity = resolveAppwriteIdentity(session);
    if (!rawIdentity) {
      return NextResponse.json(
        { error: 'Missing user identity' },
        { status: 400 }
      );
    }
    const appwriteUserId = buildStableUserId(rawIdentity);

    // Create user if not exists
    const userRes = await fetch(`${APPWRITE_ENDPOINT}/users/${appwriteUserId}`, {
      method: 'GET',
      headers: buildHeaders(),
      cache: 'no-store',
    });

    if (!userRes.ok && userRes.status === 404) {
      // Appwrite REST POST /users requires a password field
      const password = buildUserPassword(appwriteUserId);
      await fetch(`${APPWRITE_ENDPOINT}/users`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          userId: appwriteUserId,
          name: session.user.name || 'User',
          password,
        }),
      });
    }

    const senderId = resolveSenderId(session);
    if (senderId === null) {
      return NextResponse.json(
        { error: 'Unable to resolve sender ID for chat message' },
        { status: 400 }
      );
    }

    // Blocked conversation guard: if chat is blocked by either party, prevent message creation.
    const blockParams = new URLSearchParams();
    blockParams.append('queries[]', Query.equal('conversationKey', String(conversationKey)));
    blockParams.append('queries[]', Query.equal('blocked', true));
    blockParams.append('queries[]', Query.limit(1));

    const blockRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_CHAT_BLOCKS_COL_ID}/documents?${blockParams.toString()}`,
      {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
      }
    );

    if (blockRes.ok) {
      const blockPayload = await blockRes.json() as { documents?: Array<{ blocked?: boolean }> };
      if (Array.isArray(blockPayload.documents) && blockPayload.documents.length > 0 && blockPayload.documents[0]?.blocked) {
        return NextResponse.json(
          { error: 'This conversation has been blocked. You cannot send messages.' },
          { status: 403 }
        );
      }
    }

    // Build permissions for both sender and receiver
    const permissions = [
      Permission.read(Role.user(appwriteUserId)),
      Permission.write(Role.user(appwriteUserId)),
    ];

    // Add receiver permissions if email is available
    const normalizedOtherUserEmail = String(otherUserEmail || '').trim().toLowerCase();
    if (normalizedOtherUserEmail) {
      const otherUserId = buildStableUserId(normalizedOtherUserEmail);
      permissions.push(
        Permission.read(Role.user(otherUserId)),
        Permission.write(Role.user(otherUserId))
      );
    }

    const createDocRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_MESSAGES_COL_ID}/documents`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          documentId: ID.unique(),
          data: {
            conversationKey,
            senderId,
            senderType,
            senderName: session.user.name || 'User',
            content,
            read: false,
          },
          permissions,
        }),
      }
    );

    if (!createDocRes.ok) {
      const errText = await createDocRes.text();
      throw new Error(`Failed to create document (${createDocRes.status}): ${errText}`);
    }

    const createdMessage = await createDocRes.json().catch(() => null);
    return NextResponse.json({ success: true, message: createdMessage });
  } catch (error) {
    console.error('Failed to create message', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
