import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { Databases } from 'node-appwrite';
import {
  createAdminClient,
  buildStableUserId,
  DB_ID,
  PRESENCE_COL_ID,
} from '@/lib/appwrite-server';

const ONLINE_WINDOW_MS = 70 * 1000;

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

  const { otherUserEmail } = await request.json();
  const normalizedEmail = String(otherUserEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return NextResponse.json({ online: false, lastSeen: null });
  }

  const otherAppwriteId = buildStableUserId(normalizedEmail);

  try {
    const { client } = createAdminClient();
    const db = new Databases(client);

    try {
      const doc = await db.getDocument(DB_ID, PRESENCE_COL_ID, otherAppwriteId);
      const lastSeen = (doc as Record<string, unknown>).lastSeen as string | undefined ?? null;
      const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : NaN;
      const online = Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs <= ONLINE_WINDOW_MS;
      return NextResponse.json({ online, lastSeen });
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 404) {
        return NextResponse.json({ online: false, lastSeen: null });
      }
      throw err;
    }
  } catch (error) {
    console.error('Failed to fetch chat presence', error);
    return NextResponse.json({ online: false, lastSeen: null });
  }
}
