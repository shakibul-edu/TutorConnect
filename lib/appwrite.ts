import { Client, Databases } from 'appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '69c2395300216ec78422';

export const appwriteClient = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const appwriteDatabases = new Databases(appwriteClient);

export const APPWRITE_DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '69c24a79002d55f14064';
export const APPWRITE_MESSAGES_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages';
export const APPWRITE_PRESENCE_COL_ID = process.env.NEXT_PUBLIC_APPWRITE_PRESENCE_COLLECTION_ID || 'chat_presence';

let appwriteAuthReady = false;
let appwriteUserId: string | null = null;
let appwriteJwtExpiresAtMs: number | null = null;
let appwriteJwtRefreshTimer: ReturnType<typeof setTimeout> | null = null;

export const getAppwriteUserId = (): string | null => appwriteUserId;
let appwriteAuthPromise: Promise<boolean> | null = null;

const decodeJwtExpiryMs = (jwt: string): number | null => {
    try {
        const parts = jwt.split('.');
        if (parts.length < 2) return null;
        const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(payloadRaw)) as { exp?: number };
        if (!payload?.exp || !Number.isFinite(payload.exp)) return null;
        return payload.exp * 1000;
    } catch {
        return null;
    }
};

const scheduleJwtRefresh = () => {
    if (appwriteJwtRefreshTimer) {
        clearTimeout(appwriteJwtRefreshTimer);
        appwriteJwtRefreshTimer = null;
    }

    if (!appwriteJwtExpiresAtMs) return;

    const refreshBufferMs = 60 * 1000;
    const now = Date.now();
    const delayMs = Math.max(30 * 1000, appwriteJwtExpiresAtMs - now - refreshBufferMs);

    appwriteJwtRefreshTimer = setTimeout(() => {
        appwriteAuthReady = false;
        void ensureAppwriteSession(true);
    }, delayMs);
};

export const buildStableUserId = async (rawIdentity: string): Promise<string> => {
    const normalized = String(rawIdentity || '').trim().toLowerCase();
    if (!normalized) {
        throw new Error('Missing identity for Appwrite stable id generation');
    }

    const bytes = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return `tc_${hex.slice(0, 28)}`;
};

export const ensureAppwriteSession = async (forceRefresh = false): Promise<boolean> => {
    if (appwriteAuthReady && !forceRefresh) {
        if (appwriteJwtExpiresAtMs && Date.now() >= appwriteJwtExpiresAtMs - 60 * 1000) {
            appwriteAuthReady = false;
        } else {
            return true;
        }
    }

    if (appwriteAuthPromise) {
        return appwriteAuthPromise;
    }

    appwriteAuthPromise = (async () => {
        try {
            const response = await fetch('/api/appwrite/jwt', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            if (!response.ok) {
                appwriteAuthReady = false;
                appwriteJwtExpiresAtMs = null;
                return false;
            }

            const data = (await response.json()) as { jwt?: string; appwriteUserId?: string };
            if (!data?.jwt) {
                appwriteAuthReady = false;
                appwriteJwtExpiresAtMs = null;
                return false;
            }

            appwriteClient.setJWT(data.jwt);
            appwriteUserId = data.appwriteUserId || appwriteUserId;
            appwriteJwtExpiresAtMs = decodeJwtExpiryMs(data.jwt);
            appwriteAuthReady = true;
            scheduleJwtRefresh();
            return true;
        } catch (error) {
            appwriteAuthReady = false;
            appwriteJwtExpiresAtMs = null;
            console.error('Failed to initialize Appwrite auth session', error);
            return false;
        } finally {
            appwriteAuthPromise = null;
        }
    })();

    return appwriteAuthPromise;
};
