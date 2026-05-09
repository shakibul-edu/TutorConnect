import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Databases, Query } from 'node-appwrite';
import {
  createAdminClient,
  buildStableUserId,
  resolveIdentity,
  ensureAppwriteUser,
  DB_ID,
  MESSAGES_COL_ID,
  BLOCKS_COL_ID,
} from '@/lib/appwrite-server';
import { ID, Permission, Role } from 'node-appwrite';

const resolveSenderId = (session: Record<string, unknown>): number | null => {
  const id = Number((session as unknown as Record<string, unknown>).user_id);
  return Number.isFinite(id) ? id : null;
};

export async function POST(request: Request) {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    return NextResponse.json({ error: 'Missing Appwrite configuration' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if ((session as unknown as Record<string, unknown>).is_baned || (session as unknown as Record<string, unknown>).banned) {
    return NextResponse.json({ error: 'Your account is banned. Messaging is blocked.' }, { status: 403 });
  }

  const { conversationKey, content, senderType, otherUserEmail } = await request.json();

  if (!conversationKey || !content || !senderType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const rawIdentity = resolveIdentity(session as unknown as Record<string, unknown>);
    if (!rawIdentity) {
      return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
    }

    const appwriteUserId = buildStableUserId(rawIdentity);
    await ensureAppwriteUser(appwriteUserId, (session.user.name as string | undefined) || 'User');

    const senderId = resolveSenderId(session as unknown as Record<string, unknown>);
    if (senderId === null) {
      return NextResponse.json({ error: 'Unable to resolve sender ID for chat message' }, { status: 400 });
    }

    const { client } = createAdminClient();
    const db = new Databases(client);

    // Block guard
    const blockDocs = await db.listDocuments(DB_ID, BLOCKS_COL_ID, [
      Query.equal('conversationKey', String(conversationKey)),
      Query.equal('blocked', true),
      Query.limit(1),
    ]);

    if (blockDocs.documents.length > 0 && (blockDocs.documents[0] as Record<string, unknown>).blocked) {
      return NextResponse.json(
        { error: 'This conversation has been blocked. You cannot send messages.' },
        { status: 403 }
      );
    }

    // Build permissions for both sender and receiver
    const permissions = [
      Permission.read(Role.user(appwriteUserId)),
      Permission.write(Role.user(appwriteUserId)),
    ];

    const normalizedOtherEmail = String(otherUserEmail || '').trim().toLowerCase();
    if (normalizedOtherEmail) {
      const otherUserId = buildStableUserId(normalizedOtherEmail);
      permissions.push(
        Permission.read(Role.user(otherUserId)),
        Permission.write(Role.user(otherUserId))
      );
    }

    const createdMessage = await db.createDocument(
      DB_ID,
      MESSAGES_COL_ID,
      ID.unique(),
      {
        conversationKey,
        senderId,
        senderType,
        senderName: (session.user.name as string | undefined) || 'User',
        content,
        read: false,
      },
      permissions
    );

    return NextResponse.json({ success: true, message: createdMessage });
  } catch (error) {
    console.error('Failed to create message', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
