import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ID, Permission, Role } from 'appwrite';
import { authOptions } from '../../auth/[...nextauth]/route';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_CHAT_BLOCKS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_CHAT_BLOCKS_COLLECTION_ID || 'chat_blocks';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Appwrite-Project': APPWRITE_PROJECT_ID as string,
  'X-Appwrite-Key': APPWRITE_API_KEY as string,
});

const resolveSenderId = (session: any): number | null => {
  const id = Number(session?.user_id);
  return Number.isFinite(id) ? id : null;
};

const buildStableUserId = (rawIdentity: string) => {
  const digest = crypto.createHash('sha256').update(rawIdentity).digest('hex').slice(0, 28);
  return `tc_${digest}`;
};

const buildBlockDocId = (conversationKey: string) => {
  const digest = crypto.createHash('sha1').update(conversationKey).digest('hex').slice(0, 28);
  return `blk_${digest}`;
};

const resolveAppwriteIdentity = (session: any): string => {
  const email = String(session?.user?.email || '').trim().toLowerCase();
  if (email) return email;
  const backendUserId = String(session?.user_id || '').trim();
  if (backendUserId) return backendUserId;
  return '';
};

export async function POST(request: Request) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    return NextResponse.json({ error: 'Missing Appwrite configuration' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const senderId = resolveSenderId(session);
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
      const currentIdentity = resolveAppwriteIdentity(session);
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
      const upsertPayload = {
        data: {
          conversationKey: finalConversationKey,
          contactRequestId: finalContactRequestId,
          blocked: true,
          blockedBy: senderId,
          reason: finalReason,
        },
        permissions,
      };

      const updateRes = await fetch(
        `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_CHAT_BLOCKS_COL_ID}/documents/${docId}`,
        {
          method: 'PATCH',
          headers: buildHeaders(),
          body: JSON.stringify(upsertPayload),
        }
      );

      if (!updateRes.ok && updateRes.status === 404) {
        const createRes = await fetch(
          `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_CHAT_BLOCKS_COL_ID}/documents`,
          {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify({
              documentId: docId,
              ...upsertPayload,
            }),
          }
        );

        if (!createRes.ok && createRes.status !== 409) {
          const errText = await createRes.text();
          throw new Error(`Failed to create block document (${createRes.status}): ${errText}`);
        }
      } else if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Failed to update block document (${updateRes.status}): ${errText}`);
      }
    }

    // Report to backend endpoint only when explicitly requested.
    const backendAccess = (session as any).backendAccess as string | undefined;
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
