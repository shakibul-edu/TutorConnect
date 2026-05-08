import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";
import type { JWT } from "next-auth/jwt";

const client = new OAuth2Client(process.env.GOOGLE_ID);

// Decode JWT exp for proactive refresh
const decodeJwtExp = (jwt?: string): number | null => {
  try {
    if (!jwt) return null;
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch (err) {
    console.error("⚠️ Failed to decode JWT exp", err);
    return null;
  }
};

const isBackendTokenExpiring = (jwt?: string, skewSeconds = 60) => {
  const exp = decodeJwtExp(jwt);
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now >= exp - skewSeconds;
};

const refreshBackendTokens = async (backendUrl: string, refreshToken: string) => {
  try {
    const refreshRes = await fetch(`${backendUrl}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshRes.ok) {
      return refreshRes.json();
    }

    console.error('⚠️ Backend refresh failed with status', refreshRes.status);
    return null;
  } catch (error) {
    console.error('⚠️ Backend refresh failed:', error);
    return null;
  }
};

declare module "next-auth" {
  interface User {
    idToken?: string;
    backendAccess?: string;
    backendRefresh?: string;
    user_id?: number;
    is_teacher?: boolean;
    banned?: boolean;
    is_baned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    backendAccess?: string;
    backendRefresh?: string;
    user_id?: number;
    is_teacher?: boolean;
    banned?: boolean;
    is_baned?: boolean;
    banned_error?: string;
  }
}

declare module "next-auth" {
  interface Session {
    idToken?: string;
    backendAccess?: string;
    backendRefresh?: string;
    user_id?: number;
    is_teacher?: boolean;
    banned?: boolean;
    is_baned?: boolean;
    banned_error?: string;
  }
} 

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    
    CredentialsProvider({
      id: "google-onetap",
      name: "Google One Tap",
      credentials: {
        credential: { type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.credential;
        if (!token) {
          console.error('❌ No credential provided');
          return null;
        }

        try {
          console.log('🔄 Verifying Google ID token');
          const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_ID,
          });
          
          const payload = ticket.getPayload();
          if (!payload) {
            console.error('❌ No payload in token');
            return null;
          }

          console.log('✅ Google token verified successfully');
          
          // Send ID token to backend to get JWT tokens
          const backendUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';
          try {
            console.log(`🔄 Exchanging token with backend: ${backendUrl}/auth/google/`);
            const backendRes = await fetch(`${backendUrl}/auth/google/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (backendRes.ok) {
              const backendData = await backendRes.json();
              console.log('✅ Backend tokens retrieved from /auth/google/', backendData);
              
              // IMPORTANT: Return the user object with banned flag set
              // The signIn callback will handle the rejection
              return {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                image: payload.picture,
                idToken: token,
                backendAccess: backendData.access,
                backendRefresh: backendData.refresh,
                user_id: backendData.user.id,
                is_teacher: backendData.user.is_teacher,
                banned: backendData.user.banned || backendData.user?.banned,
                is_baned: backendData.user.is_baned ?? backendData.user.banned,
              };
            } else {
              console.error('⚠️ Backend token exchange failed, proceeding without backend tokens');
            }
          } catch (backendError) {
            console.error('⚠️ Backend request failed:', backendError);
            // Re-throw if it's a banned error
            if (backendError instanceof Error && backendError.message === 'Banned') {
              throw backendError;
            }
          }

          // Return user even if backend fails
          return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            image: payload.picture,
            idToken: token,
          };
        } catch (error) {
          console.error('❌ Error verifying Google token:', error);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" as const },

  callbacks: {
    async signIn({ user, account }) {
      // All banned check logic happens in jwt callback now
      // This ensures we have all info (backend data) before making decision
      return true;
    },

    async jwt({ token, user, account }) {
      const backendUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';

      // Initial sign in
      if (user) {
        token.idToken = user.idToken;
        token.backendAccess = user.backendAccess;
        token.backendRefresh = user.backendRefresh;
        token.user_id = user.user_id;
        token.is_teacher = user.is_teacher;
        token.banned = user.banned;
        token.is_baned = user.is_baned ?? user.banned;
        
        // If user is banned, set error flag but don't prevent token creation
        // This allows us to communicate the error to the client
        if (user.banned) {
          token.banned_error = 'This account is banned. Please contact support for assistance.';
          console.error('❌ User is banned:', user.email);
        }
      }

      // For Google OAuth flow (not One Tap)
      if (account?.provider === "google" && account?.id_token) {
        token.idToken = account.id_token;
        
        // Exchange Google ID token for backend JWT
        try {
          console.log(`🔄 Calling /auth/google/ endpoint: ${backendUrl}/auth/google/`);
          const backendRes = await fetch(`${backendUrl}/auth/google/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${account.id_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (backendRes.ok) {
            const backendData = await backendRes.json();
            console.log('✅ Backend tokens retrieved via OAuth /auth/google/', backendData);
            
            token.backendAccess = backendData.access;
            token.backendRefresh = backendData.refresh;
            token.user_id = backendData.user?.id ?? backendData.user_id;
            token.is_teacher = backendData.user?.is_teacher ?? backendData.is_teacher;
            token.banned = backendData.user?.banned ?? backendData.banned;
            token.is_baned = backendData.user?.is_baned ?? backendData.is_baned ?? backendData.user?.banned ?? backendData.banned;

            // Keep token/session for banned users so they can submit appeal requests.
            if (backendData.user?.banned || backendData.banned) {
              console.error('❌ User is banned:', backendData.user?.email || backendData.email);
              token.banned = true;
              token.is_baned = true;
              token.banned_error = 'Your account is banned. Please submit an appeal request.';
              return token;
            }
            
            // Verify we got the custom fields
            if (!(backendData.user?.id ?? backendData.user_id)) {
              console.error('⚠️ Backend did not return user_id! Check /auth/google/ endpoint');
            }
          } else {
            const errorText = await backendRes.text();
            console.error('⚠️ Backend token exchange failed with status', backendRes.status, errorText);
          }
        } catch (error) {
          console.error('⚠️ Backend token exchange failed:', error);
        }
      }

      // Refresh backend access token if missing or expiring soon
      const shouldRefresh = token.backendRefresh && (!token.backendAccess || isBackendTokenExpiring(token.backendAccess));
      if (shouldRefresh) {
        const refreshed = await refreshBackendTokens(backendUrl, token.backendRefresh as string);
        if (refreshed?.access) {
          token.backendAccess = refreshed.access;
          token.backendRefresh = refreshed.refresh || token.backendRefresh;
          token.is_teacher = refreshed.is_teacher ?? token.is_teacher;
          token.banned = refreshed.banned ?? token.banned;
          token.is_baned = refreshed.is_baned ?? refreshed.banned ?? token.is_baned;
          
          // Keep token for banned users so appeal submission remains possible.
          if (refreshed.banned) {
            token.banned = true;
            token.is_baned = true;
            token.banned_error = 'Your account is banned. Please submit an appeal request.';
          }
        } else {
          // Force re-login if backend token refresh fails
          console.error('❌ Failed to refresh backend tokens, forcing re-login');
          return null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.idToken = token.idToken;
      session.backendAccess = token.backendAccess;
      session.backendRefresh = token.backendRefresh;
      session.user_id = token.user_id;
      session.is_teacher = token.is_teacher;
      session.banned = token.banned;
      session.is_baned = token.is_baned ?? token.banned;
      session.banned_error = token.banned_error;
      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/auth/signin',
  },

  // CRITICAL: Must have a secret or NextAuth breaks completely
  // If NEXTAUTH_SECRET is missing, /api/auth/session returns HTML instead of JSON
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only-change-in-production',
  
  // Add debug flag to see more detailed errors
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };