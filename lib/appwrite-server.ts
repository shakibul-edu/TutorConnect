import { Client, Users } from 'node-appwrite';
import crypto from 'crypto';

const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';

if (!APPWRITE_PROJECT_ID) {
  console.error('[appwrite-server] NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set.');
}
if (!APPWRITE_API_KEY) {
  console.error('[appwrite-server] APPWRITE_API_KEY is not set.');
}

export const DB_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
export const MESSAGES_COL_ID =
  process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
export const PRESENCE_COL_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CHAT_PRESENCE_COLLECTION_ID || 'chat-presence';
export const BLOCKS_COL_ID =
  process.env.NEXT_PUBLIC_APPWRITE_CHAT_BLOCKS_COLLECTION_ID || 'chat_blocks';

/** Create a fresh Appwrite server client (with API key scope). */
export const createAdminClient = () => {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);
  return { client, users: new Users(client) };
};

/** SHA-256 hash of the identity → stable 32-char Appwrite user ID. */
export const buildStableUserId = (rawIdentity: string): string => {
  const normalized = String(rawIdentity || '').trim().toLowerCase();
  const hex = crypto.createHash('sha256').update(normalized).digest('hex');
  return `tc_${hex.slice(0, 28)}`;
};

/** HMAC-derived password so POST /users never fails for missing password. */
export const buildUserPassword = (userId: string): string => {
  const secret = APPWRITE_API_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(userId).digest('base64').slice(0, 48);
};

/** Resolve the identity string from a NextAuth session. */
export const resolveIdentity = (session: Record<string, unknown> | null): string => {
  if (!session) return '';
  const user = session.user as Record<string, unknown> | undefined;
  const email = String(user?.email || '').trim().toLowerCase();
  if (email) return email;
  const userId = String((session.user_id as string | undefined) || '').trim();
  if (userId) return userId;
  return String(user?.name || '').trim();
};

/**
 * Ensure an Appwrite user exists (creates one if not).
 * Uses node-appwrite SDK so headers/project ID are set correctly.
 */
export const ensureAppwriteUser = async (
  userId: string,
  name: string,
): Promise<void> => {
  const { users } = createAdminClient();
  try {
    await users.get(userId);
  } catch {
    // User doesn't exist — create them
    const password = buildUserPassword(userId);
    try {
      await users.create(userId, undefined, undefined, password, name);
    } catch (createErr: unknown) {
      // 409 = already exists (race condition), safe to ignore
      const code = (createErr as { code?: number })?.code;
      if (code !== 409) throw createErr;
    }
  }
};
