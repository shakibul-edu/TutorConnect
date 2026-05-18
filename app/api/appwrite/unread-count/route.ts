import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Databases, Query } from 'node-appwrite';
import {
  createAdminClient,
  buildStableUserId,
  resolveIdentity,
  ensureAppwriteUser,
  mintUserJWT,
  DB_ID,
  MESSAGES_COL_ID,
} from '@/lib/appwrite-server';

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

  const { conversationKey } = await request.json();
  if (!conversationKey) {
    return NextResponse.json({ error: 'Missing conversationKey' }, { status: 400 });
  }

  try {
    const rawIdentity = resolveIdentity(session as unknown as Record<string, unknown>);
    if (!rawIdentity) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const appwriteUserId = buildStableUserId(rawIdentity);
    const email = (session.user.email as string | undefined) || undefined;
    await ensureAppwriteUser(appwriteUserId, (session.user.name as string | undefined) || 'User', email);

    const senderIdNum = resolveSenderId(session as unknown as Record<string, unknown>);

    // Mint a short-lived JWT via token → session → JWT (correct server-side flow)
    const jwt = await mintUserJWT(appwriteUserId);

    const { Client: AppwriteClient, Databases: AppwriteDatabases } = await import('node-appwrite');
    const jwtClient = new AppwriteClient()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
      .setProject(projectId)
      .setJWT(jwt);

    const db = new AppwriteDatabases(jwtClient);

    const queries = [
      Query.equal('conversationKey', conversationKey),
      Query.equal('read', false),
    ];

    if (senderIdNum !== null) {
      queries.push(Query.notEqual('senderId', senderIdNum));
    }

    const res = await db.listDocuments(DB_ID, MESSAGES_COL_ID, queries);

    return NextResponse.json({ unreadCount: res.total });
  } catch (error) {
    console.error('Failed to fetch unread count', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
