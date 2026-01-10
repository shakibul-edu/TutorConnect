
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
      // Initial sign in
      if (account && user) {
        if (account.provider === "google") {
          token.id_token = account.id_token;
        } else if (account.provider === "googleonetap") {
          token.id_token = user.id_token;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // Pass id_token to the client session so LocationHook can use it
      session.id_token = token.id_token;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
