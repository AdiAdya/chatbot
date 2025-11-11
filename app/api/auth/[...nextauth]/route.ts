import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "next-auth";

interface ExtendedUser extends User {
  id: string;
  isPremium?: boolean;
  stripeStatus?: string;
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
        console.log('Authorize called with:', credentials?.email);
        // Accept any email/password combination for demo
        if (credentials?.email && credentials?.password) {
          // Fetch real subscription status from TutorChase API
          try {
            const tutorChaseApiUrl = process.env.TUTORCHASE_API_URL || 'http://localhost:3000';
            console.log('Fetching subscription status from:', `${tutorChaseApiUrl}/api/users/subscription-status?email=${encodeURIComponent(credentials.email)}`);
            
            const response = await fetch(`${tutorChaseApiUrl}/api/users/subscription-status?email=${encodeURIComponent(credentials.email)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            let stripeStatus = 'FREE';
            let isPremium = false;

            if (response.ok) {
              const userData = await response.json();
              stripeStatus = userData.stripeStatus || 'FREE';
              // TRIAL and PAID users get premium features
              isPremium = stripeStatus === 'TRIAL' || stripeStatus === 'PAID';
            }

            const user = {
              id: '1',
              email: credentials.email,
              name: credentials.email.split('@')[0], // Use part before @ as name
              isPremium: isPremium,
              stripeStatus: stripeStatus,
            };
            console.log('Returning user:', user);
            return user;
          } catch (error) {
            console.error('Error fetching subscription status:', error);
            // Default to FREE if there's an error
            const user = {
              id: '1',
              email: credentials.email,
              name: credentials.email.split('@')[0],
              isPremium: false,
              stripeStatus: 'FREE',
            };
            console.log('Returning default user:', user);
            return user;
          }
        }
        console.log('No credentials provided');
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
        (session.user as ExtendedUser).isPremium = token.isPremium as boolean;
        (session.user as ExtendedUser).stripeStatus = token.stripeStatus as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.isPremium = (user as ExtendedUser).isPremium;
        token.stripeStatus = (user as ExtendedUser).stripeStatus;
      }
      return token;
    }
  },
});

export { handler as GET, handler as POST }; 