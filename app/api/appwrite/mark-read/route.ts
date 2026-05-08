import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Query } from 'appwrite';
import { authOptions } from '../../auth/[...nextauth]/route';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Appwrite-Project': APPWRITE_PROJECT_ID as string,
  'X-Appwrite-Key': APPWRITE_API_KEY as string,
});

const resolveSenderId = (session: any): number | null => {
  const id = Number(session?.user_id);
  return Number.isFinite(id) ? id : null;
};

interface AppwriteListResponse {
  documents: Array<{ $id: string }>;
}

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
    return NextResponse.json({ updated: 0 });
  }

  const { conversationKey } = await request.json();
  if (!conversationKey) {
    return NextResponse.json({ error: 'Missing conversationKey' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams();
    params.append('queries[]', Query.equal('conversationKey', String(conversationKey)));
    params.append('queries[]', Query.equal('read', false));
    params.append('queries[]', Query.notEqual('senderId', senderId));
    params.append('queries[]', Query.limit(100));

    const listRes = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_MESSAGES_COL_ID}/documents?${params.toString()}`,
      {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
      }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`Failed to list unread messages (${listRes.status}): ${errText}`);
    }

    const payload = (await listRes.json()) as AppwriteListResponse;
    const docs = payload.documents || [];

    let updated = 0;
    for (const doc of docs) {
      const updateRes = await fetch(
        `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_MESSAGES_COL_ID}/documents/${doc.$id}`,
        {
          method: 'PATCH',
          headers: buildHeaders(),
          body: JSON.stringify({ data: { read: true } }),
        }
      );

      if (updateRes.ok) {
        updated += 1;
      }
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Failed to mark messages as read', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
