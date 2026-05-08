import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

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
  return String(session?.user?.name || '').trim();
};

const ensureUserExists = async (userId: string, name: string) => {
  const userRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}`, {
    method: 'GET',
    headers: buildHeaders(),
    cache: 'no-store',
  });

  if (userRes.ok) {
    return true;
  }

  if (userRes.status !== 404) {
    const text = await userRes.text();
    throw new Error(`Appwrite get user failed (${userRes.status}): ${text}`);
  }

  const createRes = await fetch(`${APPWRITE_ENDPOINT}/users`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      userId,
      name,
    }),
  });

  if (createRes.ok || createRes.status === 409) {
    return true;
  }

  const createText = await createRes.text();
  throw new Error(`Appwrite create user failed (${createRes.status}): ${createText}`);
};

export async function GET() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    return NextResponse.json(
      { error: 'Missing APPWRITE project ID or API key in server environment.' },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rawIdentity = resolveAppwriteIdentity(session);
  if (!rawIdentity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  const userId = buildStableUserId(rawIdentity);
  const name = session.user.name || 'TutorConnect User';

  try {
    await ensureUserExists(userId, name);

    const jwtRes = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/jwts`, {
      method: 'POST',
      headers: buildHeaders(),
      cache: 'no-store',
    });

    if (!jwtRes.ok) {
      const jwtText = await jwtRes.text();
      throw new Error(`Appwrite create JWT failed (${jwtRes.status}): ${jwtText}`);
    }

    const jwtPayload = (await jwtRes.json()) as { jwt: string };
    return NextResponse.json({ jwt: jwtPayload.jwt, appwriteUserId: userId });
  } catch (error) {
    console.error('Failed to mint Appwrite JWT', error);
    return NextResponse.json({ error: 'Failed to authenticate chat session' }, { status: 500 });
  }
}
