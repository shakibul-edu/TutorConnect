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
              
              // Check if user is banned
              if (backendData.banned) {
                console.error('❌ User is banned, rejecting login');
                return null;
              }
              
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
                banned: backendData.user.banned,
              };
            } else {
              console.error('⚠️ Backend token exchange failed, proceeding without backend tokens');
            }
          } catch (backendError) {
            console.error('⚠️ Backend request failed:', backendError);
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
        
        // Check if user is banned
        if (user.banned) {
          console.error('❌ User is banned, rejecting login');
          throw new Error('This account is banned.');
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
            token.user_id = backendData.user_id;
            token.is_teacher = backendData.is_teacher;
            token.banned = backendData.banned;
            
            // Verify we got the custom fields
            if (!backendData.user_id) {
              console.error('⚠️ Backend did not return user_id! Check /auth/google/ endpoint');
            }
            
            // Check if user is banned
            if (backendData.banned) {
              console.error('❌ User is banned, rejecting login');
              throw new Error('This account is banned.');
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
          
          // Check if user became banned during refresh
          if (refreshed.banned) {
            console.error('❌ User is banned, forcing re-login');
            return null;
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
      return session;
    },
  },

  pages: {
    signIn: '/',
  },

  // CRITICAL: Must have a secret or NextAuth breaks completely
  // If NEXTAUTH_SECRET is missing, /api/auth/session returns HTML instead of JSON
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only-change-in-production',
  
  // Add debug flag to see more detailed errors
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };