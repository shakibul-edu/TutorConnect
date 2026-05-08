import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Client, Databases } from 'appwrite';
import { Query } from 'appwrite';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

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

  const { conversationKey } = await request.json();
  if (!conversationKey) {
    return NextResponse.json(
      { error: 'Missing conversationKey' },
      { status: 400 }
    );
  }

  try {
    const rawIdentity = resolveAppwriteIdentity(session);
    if (!rawIdentity) {
      return NextResponse.json({ unreadCount: 0 });
    }
    const appwriteUserId = buildStableUserId(rawIdentity);
    const senderIdNum = resolveSenderId(session);

    // Get JWT for this user
    const jwtRes = await fetch(`${APPWRITE_ENDPOINT}/users/${appwriteUserId}/jwts`, {
      method: 'POST',
      headers: buildHeaders(),
      cache: 'no-store',
    });

    if (!jwtRes.ok) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const jwtPayload = (await jwtRes.json()) as { jwt: string };

    // Create Appwrite client with JWT
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setJWT(jwtPayload.jwt);

    const databases = new Databases(client);

    // Query unread messages NOT from current user
    const queries = [
      Query.equal('conversationKey', conversationKey),
      Query.equal('read', false),
    ];

    // Avoid passing invalid senderId value into Appwrite query filters.
    if (senderIdNum !== null) {
      queries.push(Query.notEqual('senderId', senderIdNum));
    }

    const res = await databases.listDocuments({
      databaseId: APPWRITE_DB_ID,
      collectionId: APPWRITE_MESSAGES_COL_ID,
      queries,
    });

    return NextResponse.json({ unreadCount: res.total });
  } catch (error) {
    console.error('Failed to fetch unread count', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
