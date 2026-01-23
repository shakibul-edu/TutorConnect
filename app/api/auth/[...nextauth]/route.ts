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
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    backendAccess?: string;
    backendRefresh?: string;
  }
}

declare module "next-auth" {
  interface Session {
    idToken?: string;
    backendAccess?: string;
    backendRefresh?: string;
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
              console.log('✅ Backend tokens retrieved');
              return {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                image: payload.picture,
                idToken: token,
                backendAccess: backendData.access,
                backendRefresh: backendData.refresh,
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
      }

      // For Google OAuth flow (not One Tap)
      if (account?.provider === "google" && account?.id_token) {
        token.idToken = account.id_token;
        
        // Exchange Google ID token for backend JWT
        try {
          const backendRes = await fetch(`${backendUrl}/api/token/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${account.id_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (backendRes.ok) {
            const backendData = await backendRes.json();
            console.log('✅ Backend tokens retrieved via OAuth flow');
            token.backendAccess = backendData.access;
            token.backendRefresh = backendData.refresh;
          } else {
            console.error('⚠️ Backend token exchange failed with status', backendRes.status);
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
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.idToken = token.idToken;
      session.backendAccess = token.backendAccess;
      session.backendRefresh = token.backendRefresh;
      return session;
    },
  },

  pages: {
    signIn: '/',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
