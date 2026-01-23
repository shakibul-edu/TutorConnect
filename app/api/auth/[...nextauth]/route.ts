
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Function to refresh Google access token
async function refreshGoogleToken(refreshToken: string) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ID as string,
        client_secret: process.env.GOOGLE_SECRET as string,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Token refresh failed");
    }

    return data;
  } catch (error) {
    console.error("Google token refresh error:", error);
    throw error;
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      id: "googleonetap",
      name: "Google One Tap",
      credentials: {
        credential: { type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.credential;
        if (!idToken) return null;

        try {
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
          const payload = await response.json();

          if (!response.ok) {
            console.error("Token verification failed:", payload);
            throw new Error(payload.error_description || "Token verification failed");
          }

          // Verify Audience matches Google Client ID
          if (payload.aud !== process.env.GOOGLE_ID) {
            console.error("Audience mismatch:", payload.aud);
            throw new Error("Invalid audience");
          }

          // Return user object with id_token for JWT callback
          return {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            image: payload.picture,
            id_token: idToken, // Custom property to pass to token
          };
        } catch (error) {
          console.error("Google One Tap Auth Error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }: any) {
      // Initial sign in - store tokens and expiration
      if (account && user) {
        if (account.provider === "google") {
          token.id_token = account.id_token;
          token.access_token = account.access_token;
          token.refresh_token = account.refresh_token;
          token.expires_at = account.expires_at || Math.floor(Date.now() / 1000) + 3600; // 1 hour default
        } else if (account.provider === "googleonetap") {
          token.id_token = user.id_token;
        }
      }

      // Check if token needs refresh (if expired or within 5 minutes of expiry)
      if (token.expires_at && typeof token.expires_at === 'number') {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = token.expires_at - now;

        // Refresh if expired or within 5 minutes of expiring
        if (timeUntilExpiry < 300) {
          // If we don't have a refresh token (e.g. Google One Tap), we can't refresh
          if (!token.refresh_token) {
            console.log("Token expiring and no refresh token available. Marking as expired.");
            token.error = "AccessTokenExpired";
            return token;
          }

          try {
            if (token.refresh_token) {
              const newTokenData = await refreshGoogleToken(token.refresh_token as string);
              token.access_token = newTokenData.access_token;
              token.id_token = newTokenData.id_token || token.id_token;
              token.expires_at = Math.floor(Date.now() / 1000) + (newTokenData.expires_in || 3600);
              // Update refresh token if a new one is returned (rotation)
              if (newTokenData.refresh_token) {
                token.refresh_token = newTokenData.refresh_token;
              }
              console.log('Token refreshed successfully');
              // Clear any previous errors
              delete token.error;
            }
          } catch (error) {
            console.error('Failed to refresh token:', error);
            token.error = 'RefreshAccessTokenError';
          }
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      // Check for refresh errors or expiration
      if (token.error === 'RefreshAccessTokenError' || token.error === 'AccessTokenExpired') {
        session.error = token.error;
      }

      // Pass id_token to the client session so it can be used for API calls
      session.id_token = token.id_token;
      session.access_token = token.access_token;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
