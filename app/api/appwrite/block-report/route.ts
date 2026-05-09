import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Databases, Permission, Role } from 'node-appwrite';
import {
  createAdminClient,
  buildStableUserId,
  resolveIdentity,
  DB_ID,
  BLOCKS_COL_ID,
} from '@/lib/appwrite-server';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';

const resolveSenderId = (session: Record<string, unknown>): number | null => {
  const id = Number((session as unknown as Record<string, unknown>).user_id);
  return Number.isFinite(id) ? id : null;
};

const buildBlockDocId = (conversationKey: string): string => {
  const digest = crypto.createHash('sha1').update(conversationKey).digest('hex').slice(0, 28);
  return `blk_${digest}`;
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
    return NextResponse.json({ error: 'Unable to resolve sender ID' }, { status: 400 });
  }

  const {
    conversation_key,
    conversationKey,
    contact_request,
    contactRequestId,
    reason,
    block,
    report,
    otherUserEmail,
  } = await request.json();

  const finalConversationKey = String(conversation_key || conversationKey || '').trim();
  const finalContactRequestId = Number(contact_request ?? contactRequestId ?? 0);
  const finalReason = String(reason || '').trim();
  const shouldBlock = Boolean(block);
  const shouldReport = Boolean(report);

  if (!finalConversationKey || !finalContactRequestId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    if (shouldBlock) {
      const currentIdentity = resolveIdentity(session as unknown as Record<string, unknown>);
      const currentUserId = buildStableUserId(currentIdentity || String(senderId));

      const permissions = [
        Permission.read(Role.user(currentUserId)),
        Permission.write(Role.user(currentUserId)),
      ];

      const normalizedOtherEmail = String(otherUserEmail || '').trim().toLowerCase();
      if (normalizedOtherEmail) {
        const otherAppwriteId = buildStableUserId(normalizedOtherEmail);
        permissions.push(Permission.read(Role.user(otherAppwriteId)));
      }

      const docId = buildBlockDocId(finalConversationKey);
      const docData = {
        conversationKey: finalConversationKey,
        contactRequestId: finalContactRequestId,
        blocked: true,
        blockedBy: senderId,
        reason: finalReason,
      };

      const { client } = createAdminClient();
      const db = new Databases(client);

      try {
        await db.updateDocument(DB_ID, BLOCKS_COL_ID, docId, docData, permissions);
      } catch (updateErr: unknown) {
        const code = (updateErr as { code?: number })?.code;
        if (code !== 404) throw updateErr;

        try {
          await db.createDocument(DB_ID, BLOCKS_COL_ID, docId, docData, permissions);
        } catch (createErr: unknown) {
          const createCode = (createErr as { code?: number })?.code;
          if (createCode !== 409) throw createErr;
          // 409 = already exists (race condition), ignore
        }
      }
    }

    // Report to backend only when explicitly requested
    const backendAccess = (session as unknown as Record<string, unknown>).backendAccess as string | undefined;
    if (shouldReport && backendAccess) {
      await fetch(`${BASE_URL}/block-report/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendAccess}`,
        },
        body: JSON.stringify({
          conversation_key: finalConversationKey,
          contact_request: finalContactRequestId,
          reason: finalReason,
        }),
      });
    }

    return NextResponse.json({ success: true, blocked: shouldBlock });
  } catch (error) {
    console.error('Failed to process block/report', error);
    return NextResponse.json({ error: 'Failed to process block/report' }, { status: 500 });
  }
}
