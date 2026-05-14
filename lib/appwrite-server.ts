import { Client, Users, Account } from 'node-appwrite';
import crypto from 'crypto';

export const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
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
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
    console.error('[appwrite-server] Admin client missing config:', {
      hasEndpoint: !!APPWRITE_ENDPOINT,
      hasProjectId: !!APPWRITE_PROJECT_ID,
      hasApiKey: !!APPWRITE_API_KEY,
    });
  }
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
 * Test the admin client connection and permissions
 */
export const testAdminConnection = async (): Promise<void> => {
  const { users } = createAdminClient();
  try {
    console.log('[appwrite-server] Testing admin connection by attempting list users...');
    // Try to list users (this requires users.read scope)
    const usersList = await users.list();
    console.log('[appwrite-server] ✓ Admin connection successful, users in project:', usersList.total);
  } catch (error: unknown) {
    console.error('[appwrite-server] ✗ Admin connection failed:', {
      code: (error as { code?: number })?.code,
      message: (error as Error)?.message,
      fullError: error,
    });
    throw new Error(`Appwrite admin client test failed: ${(error as Error)?.message}`);
  }
};

/**
 * Ensure an Appwrite user exists (creates one if not found).
 * - Checks specifically for 404 so other errors (auth, network) are not swallowed.
 * - Creates user with email when available so the account is properly identified.
 */
export const ensureAppwriteUser = async (
  userId: string,
  name: string,
  email?: string,
): Promise<void> => {
  const { users } = createAdminClient();
  try {
    await users.get(userId);
    console.log('[appwrite-server] User exists:', userId);
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code !== 404) {
      // Re-throw anything that isn't "user not found" (e.g. bad API key, network error)
      console.error('[appwrite-server] Unexpected error checking user:', e);
      throw e;
    }

    // 404 — user doesn't exist, create them
    console.log('[appwrite-server] User not found, creating:', userId);
    console.log('[appwrite-server] Create params - userId:', userId, 'email:', email, 'name:', name);
    try {
      // Pass email for a proper account identity; no password → passwordless/token-based login
      const result = await users.create(userId, email || undefined, undefined, name);
      console.log('[appwrite-server] User created:', userId, 'Result:', result);
    } catch (createErr: unknown) {
      // 409 = already exists due to a race condition — safe to ignore
      const createCode = (createErr as { code?: number })?.code;
      console.error('[appwrite-server] Create error details:', {
        code: createCode,
        message: (createErr as Error)?.message,
        fullError: createErr,
      });
      if (createCode !== 409) {
        console.error('[appwrite-server] Failed to create user:', createErr);
        throw createErr;
      }
      console.log('[appwrite-server] User already exists (race condition 409), continuing');
    }
  }
};

/**
 * Mint a short-lived Appwrite JWT for `userId` using the
 * token → user-scoped session → JWT flow.
 *
 * This is the correct pattern for server-side JWT minting because
 * `users.createJWT()` (admin API) can return 404 if the user doesn't
 * have an active session, whereas this flow creates a proper session first.
 */
export const mintUserJWT = async (userId: string): Promise<string> => {
  const { users } = createAdminClient();

  try {
    // 1. Admin creates a short-lived magic token for this user
    console.log('[appwrite-server] Creating token for:', userId);
    const token = await users.createToken(userId);
    console.log('[appwrite-server] Token created for:', userId, 'Secret present:', !!token.secret);

    // 2. Build a user-scoped (no API key) Appwrite client
    const userClient = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);

    const userAccount = new Account(userClient);

    // 3. Exchange the token for a real session
    console.log('[appwrite-server] Creating session with token for:', userId);
    await userAccount.createSession(userId, token.secret);
    console.log('[appwrite-server] Session created for:', userId);

    // 4. Mint a JWT from the authenticated user-scoped account
    console.log('[appwrite-server] Minting JWT for:', userId);
    const jwtResult = await userAccount.createJWT();
    console.log('[appwrite-server] JWT minted for:', userId);

    return jwtResult.jwt;
  } catch (error: unknown) {
    console.error('[appwrite-server] JWT minting error:', {
      code: (error as { code?: number })?.code,
      message: (error as Error)?.message,
      fullError: error,
    });
    throw error;
  }
};
