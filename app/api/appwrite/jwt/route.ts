import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import {
  createAdminClient,
  buildStableUserId,
  resolveIdentity,
  ensureAppwriteUser,
} from '@/lib/appwrite-server';

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  console.log('[JWT-DEBUG] Appwrite endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('[JWT-DEBUG] Project ID:', projectId);
  console.log('[JWT-DEBUG] API Key present:', !!apiKey);

  if (!projectId || !apiKey) {
    console.error('[appwrite/jwt] Missing env: NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY');
    return NextResponse.json(
      { error: 'Missing Appwrite configuration on the server.' },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  console.log('[JWT-DEBUG] Session found:', !!session);
  console.log('[JWT-DEBUG] Session user:', session?.user ? JSON.stringify(session.user) : 'null');

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rawIdentity = resolveIdentity(session as unknown as Record<string, unknown>);
  console.log('[JWT-DEBUG] Raw identity:', rawIdentity);
  if (!rawIdentity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  const userId = buildStableUserId(rawIdentity);
  console.log('[JWT-DEBUG] Stable userId:', userId);
  const name = (session.user.name as string | undefined) || 'TutorConnect User';

  try {
    await ensureAppwriteUser(userId, name);

    const { users } = createAdminClient();
    const jwtResponse = await users.createJWT(userId);

    return NextResponse.json({ jwt: jwtResponse.jwt, appwriteUserId: userId });
  } catch (error) {
    console.error('[JWT-DEBUG] Failed to mint Appwrite JWT — full error:', error);
    console.error('[JWT-DEBUG] Error message:', (error as Error)?.message);
    console.error('[JWT-DEBUG] Error stack:', (error as Error)?.stack);
    return NextResponse.json({ error: 'Failed to authenticate chat session' }, { status: 500 });
  }
}
