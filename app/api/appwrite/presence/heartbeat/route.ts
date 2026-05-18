import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { Databases } from 'node-appwrite';
import {
  createAdminClient,
  buildStableUserId,
  resolveIdentity,
  DB_ID,
  PRESENCE_COL_ID,
} from '@/lib/appwrite-server';

export async function POST() {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId || !apiKey) {
    return NextResponse.json({ error: 'Missing Appwrite configuration' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rawIdentity = resolveIdentity(session as unknown as Record<string, unknown>);
  if (!rawIdentity) {
    return NextResponse.json({ error: 'Missing user identity' }, { status: 400 });
  }

  const appwriteUserId = buildStableUserId(rawIdentity);
  const now = new Date().toISOString();

  try {
    const { client } = createAdminClient();
    const db = new Databases(client);

    try {
      await db.updateDocument(DB_ID, PRESENCE_COL_ID, appwriteUserId, {
        userId: appwriteUserId,
        lastSeen: now,
      });
      return NextResponse.json({ ok: true, lastSeen: now });
    } catch (updateErr: unknown) {
      const code = (updateErr as { code?: number })?.code;
      if (code !== 404) throw updateErr;

      // Document doesn't exist yet — create it
      try {
        await db.createDocument(DB_ID, PRESENCE_COL_ID, appwriteUserId, {
          userId: appwriteUserId,
          lastSeen: now,
        });
        return NextResponse.json({ ok: true, lastSeen: now });
      } catch (createErr: unknown) {
        const createCode = (createErr as { code?: number })?.code;
        if (createCode === 409) {
          // Race condition: another request created it, retry the update
          await db.updateDocument(DB_ID, PRESENCE_COL_ID, appwriteUserId, {
            userId: appwriteUserId,
            lastSeen: now,
          });
          return NextResponse.json({ ok: true, lastSeen: now });
        }
        throw createErr;
      }
    }
  } catch (error) {
    console.error('Failed to update chat presence', error);
    return NextResponse.json({ error: 'Failed to update chat presence' }, { status: 500 });
  }
}
