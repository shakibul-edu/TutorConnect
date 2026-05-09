import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Databases, Query } from 'node-appwrite';
import {
  createAdminClient,
  DB_ID,
  BLOCKS_COL_ID,
} from '@/lib/appwrite-server';

const resolveSenderId = (session: Record<string, unknown>): number | null => {
  const id = Number((session as unknown as Record<string, unknown>).user_id);
  return Number.isFinite(id) ? id : null;
};

interface BlockDocument {
  blocked: boolean;
  blockedBy?: number;
  reason?: string;
}

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
    return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
  }

  try {
    const { client } = createAdminClient();
    const db = new Databases(client);

    const result = await db.listDocuments(DB_ID, BLOCKS_COL_ID, [
      Query.equal('conversationKey', String(conversationKey)),
      Query.equal('blocked', true),
      Query.limit(1),
    ]);

    const item = result.documents[0] as unknown as (BlockDocument & Record<string, unknown>) | undefined;
    if (!item) {
      return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
    }

    const senderId = resolveSenderId(session as unknown as Record<string, unknown>);
    const blockedByCurrentUser = senderId !== null && Number(item.blockedBy) === senderId;

    return NextResponse.json({
      blocked: true,
      blockedByCurrentUser,
      reason: item.reason || null,
    });
  } catch (error) {
    console.error('Failed to get block status', error);
    return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
  }
}
