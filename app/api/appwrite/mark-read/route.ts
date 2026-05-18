import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Databases, Query } from 'node-appwrite';
import {
  createAdminClient,
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

  const senderId = resolveSenderId(session as unknown as Record<string, unknown>);
  if (senderId === null) {
    return NextResponse.json({ updated: 0 });
  }

  const { conversationKey } = await request.json();
  if (!conversationKey) {
    return NextResponse.json({ error: 'Missing conversationKey' }, { status: 400 });
  }

  try {
    const { client } = createAdminClient();
    const db = new Databases(client);

    const unreadDocs = await db.listDocuments(DB_ID, MESSAGES_COL_ID, [
      Query.equal('conversationKey', String(conversationKey)),
      Query.equal('read', false),
      Query.notEqual('senderId', senderId),
      Query.limit(100),
    ]);

    let updated = 0;
    for (const doc of unreadDocs.documents) {
      try {
        await db.updateDocument(DB_ID, MESSAGES_COL_ID, doc.$id, { read: true });
        updated += 1;
      } catch {
        // best-effort, continue with remaining docs
      }
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Failed to mark messages as read', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
