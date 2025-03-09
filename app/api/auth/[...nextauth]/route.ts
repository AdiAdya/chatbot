import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "next-auth";

interface ExtendedUser extends User {
  id: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // For demo purposes, accept any email/password combination
        if (credentials?.email && credentials?.password) {
          return {
            id: '1',
            email: credentials.email,
            name: credentials.email.split('@')[0], // Use part before @ as name
          }
        }
        return null;
      }
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        (session.user as ExtendedUser).id = token.sub as string;
      }
      return session;
    }
  },
});

export { handler as GET, handler as POST }; 