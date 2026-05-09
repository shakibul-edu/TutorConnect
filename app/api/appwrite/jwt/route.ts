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

  if (!projectId || !apiKey) {
    console.error('[appwrite/jwt] Missing env: NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY');
    return NextResponse.json(
      { error: 'Missing Appwrite configuration on the server.' },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rawIdentity = resolveIdentity(session as unknown as Record<string, unknown>);
  if (!rawIdentity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  const userId = buildStableUserId(rawIdentity);
  const name = (session.user.name as string | undefined) || 'TutorConnect User';

  try {
    await ensureAppwriteUser(userId, name);

    const { users } = createAdminClient();
    const jwtResponse = await users.createJWT(userId);

    return NextResponse.json({ jwt: jwtResponse.jwt, appwriteUserId: userId });
  } catch (error) {
    console.error('Failed to mint Appwrite JWT', error);
    return NextResponse.json({ error: 'Failed to authenticate chat session' }, { status: 500 });
  }
}
