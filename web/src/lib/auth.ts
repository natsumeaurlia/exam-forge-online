import { AuthOptions, NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider, {
  CredentialsConfig,
} from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import './auth-config-validator';
import { OAuthConfig } from 'next-auth/providers/oauth';
import { EmailConfig } from 'next-auth/providers/email';

// Helper function to create providers based on available environment variables
function createAuthProviders() {
  const providers: (OAuthConfig<any> | EmailConfig | CredentialsConfig)[] = [];

  // Add Google provider only if both credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }

  // Add GitHub provider only if both credentials are available
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    );
  }

  // Always add credentials provider
  providers.push(
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // パスワードを検証
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    })
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: createAuthProviders(),
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github' || account?.provider === 'google') {
        return true;
      }

      if (!user.id) {
        return false;
      }

      const existingUser = await prisma.user.findFirst({
        where: { id: user.id },
      });

      if (!existingUser) {
        return false;
      }

      return true;
    },

    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      const existingUser = await prisma.user.findFirst({
        where: { id: token.sub },
      });

      if (!existingUser) {
        return token;
      }

      token.name = existingUser.name;
      token.email = existingUser.email;
      token.image = existingUser.image;
      return token;
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    newUser: '/auth/signup',
    error: '/auth/error',
  },
};

export function auth() {
  return getServerSession(authOptions);
}

// SECURITY FIX: Server-side only function to check OAuth providers
// This should only be used server-side and never exposed to client
function getAvailableProvidersInternal() {
  return {
    google: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    github: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    credentials: true, // Always available
  };
}

// SECURITY: Safe client-side provider check (no configuration details exposed)
export function getEnabledProviders() {
  // Only expose provider names that are actually configured
  const providers = getAvailableProvidersInternal();
  return Object.keys(providers).filter(
    key => providers[key as keyof typeof providers]
  );
}
