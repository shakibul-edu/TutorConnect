import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Query } from 'appwrite';
import { authOptions } from '../../auth/[...nextauth]/route';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
const APPWRITE_CHAT_BLOCKS_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_CHAT_BLOCKS_COLLECTION_ID || 'chat_blocks';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Appwrite-Project': APPWRITE_PROJECT_ID as string,
  'X-Appwrite-Key': APPWRITE_API_KEY as string,
});

const resolveSenderId = (session: any): number | null => {
  const id = Number(session?.user_id);
  return Number.isFinite(id) ? id : null;
};

interface BlockDocument {
  blocked: boolean;
  blockedBy?: number;
  reason?: string;
}

interface AppwriteListResponse<T> {
  documents: T[];
}

export async function POST(request: Request) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    return NextResponse.json({ error: 'Missing Appwrite configuration' }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { conversationKey } = await request.json();
  if (!conversationKey) {
    return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
  }

  try {
    const params = new URLSearchParams();
    params.append('queries[]', Query.equal('conversationKey', String(conversationKey)));
    params.append('queries[]', Query.equal('blocked', true));
    params.append('queries[]', Query.limit(1));

    const res = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DB_ID}/collections/${APPWRITE_CHAT_BLOCKS_COL_ID}/documents?${params.toString()}`,
      {
        method: 'GET',
        headers: buildHeaders(),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
      }
      const errText = await res.text();
      throw new Error(`Failed to read chat block status (${res.status}): ${errText}`);
    }

    const payload = (await res.json()) as AppwriteListResponse<BlockDocument>;
    const item = payload.documents?.[0];
    if (!item) {
      return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
    }

    const senderId = resolveSenderId(session);
    const blockedByCurrentUser = senderId !== null && Number(item.blockedBy) === senderId;

    return NextResponse.json({
      blocked: true,
      blockedByCurrentUser,
      reason: item.reason || null,
    });
  } catch (error) {
    console.error('Failed to get block status', error);
    return NextResponse.json({ blocked: false, blockedByCurrentUser: false, reason: null });
  }
}
