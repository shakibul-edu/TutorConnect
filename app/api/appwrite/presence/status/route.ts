import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_PRESENCE_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PRESENCE_COLLECTION_ID || 'chat_presence';
const ONLINE_WINDOW_MS = 70 * 1000;

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Appwrite-Project': APPWRITE_PROJECT_ID as string,
  'X-Appwrite-Key': APPWRITE_API_KEY as string,
});

const buildStableUserId = (rawIdentity: string) => {
  const digest = crypto.createHash('sha256').update(rawIdentity).digest('hex').slice(0, 28);
  return `tc_${digest}`;
};

export async function POST(request: Request) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
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
    const res = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_PRESENCE_COL_ID}/documents/${otherAppwriteId}`,
      {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      return NextResponse.json({ online: false, lastSeen: null });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch presence (${res.status}): ${errText}`);
    }

    const payload = (await res.json()) as { lastSeen?: string };
    const lastSeen = payload.lastSeen || null;
    const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : NaN;
    const online = Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs <= ONLINE_WINDOW_MS;

    return NextResponse.json({ online, lastSeen });
  } catch (error) {
    console.error('Failed to fetch chat presence', error);
    return NextResponse.json({ online: false, lastSeen: null });
  }
}
