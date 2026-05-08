import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_PRESENCE_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PRESENCE_COLLECTION_ID || 'chat_presence';

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

export async function POST() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    return NextResponse.json({ error: 'Missing Appwrite configuration' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rawIdentity = resolveAppwriteIdentity(session);
  if (!rawIdentity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  const appwriteUserId = buildStableUserId(rawIdentity);
  const now = new Date().toISOString();

  try {
    const updateRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_PRESENCE_COL_ID}/documents/${appwriteUserId}`,
      {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ data: { userId: appwriteUserId, lastSeen: now } }),
      }
    );

    if (updateRes.ok) {
      return NextResponse.json({ ok: true, lastSeen: now });
    }

    if (updateRes.status !== 404) {
      const errText = await updateRes.text();
      throw new Error(`Failed to update presence (${updateRes.status}): ${errText}`);
    }

    const createRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_PRESENCE_COL_ID}/documents`,
      {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          documentId: appwriteUserId,
          data: {
            userId: appwriteUserId,
            lastSeen: now,
          },
        }),
      }
    );

    if (!createRes.ok) {
      if (createRes.status === 409) {
        // Another in-flight heartbeat already created this document; update it and continue.
        const retryUpdateRes = await fetch(
          `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_PRESENCE_COL_ID}/documents/${appwriteUserId}`,
          {
            method: 'PATCH',
            headers: buildHeaders(),
            body: JSON.stringify({ data: { userId: appwriteUserId, lastSeen: now } }),
          }
        );

        if (retryUpdateRes.ok) {
          return NextResponse.json({ ok: true, lastSeen: now });
        }

        const retryText = await retryUpdateRes.text();
        throw new Error(`Failed to update presence after conflict (${retryUpdateRes.status}): ${retryText}`);
      }

      const createText = await createRes.text();
      throw new Error(`Failed to create presence (${createRes.status}): ${createText}`);
    }

    return NextResponse.json({ ok: true, lastSeen: now });
  } catch (error) {
    console.error('Failed to update chat presence', error);
    return NextResponse.json({ error: 'Failed to update chat presence' }, { status: 500 });
  }
}
