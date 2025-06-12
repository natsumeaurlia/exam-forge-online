import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import './auth-config-validator';

// Helper function to create providers based on available environment variables
function createAuthProviders() {
  const providers: any[] = [];

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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Note: This will be redirected with locale in middleware
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // callbackUrlから言語情報を保持
      let locale = 'ja';

      // URLから言語パラメータを抽出
      const urlObj = new URL(url, baseUrl);
      const pathname = urlObj.pathname;
      const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);

      if (langMatch) {
        locale = langMatch[1];
      }

      // callbackUrlがある場合はそれを優先（セキュリティチェック強化）
      const callbackUrl = urlObj.searchParams.get('callbackUrl');
      if (callbackUrl) {
        // callbackUrlが相対URLの場合のみ許可
        if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return callbackUrl;
        }
        // 絶対URLは許可しない（Open Redirect脆弱性対策）
        console.warn('Blocked potential open redirect attempt:', callbackUrl);
      }

      // サインイン後は言語を保持してダッシュボードにリダイレクト
      if (pathname.includes('/auth/')) {
        return `${baseUrl}/${locale}/dashboard`;
      }

      // 相対URLの場合はbaseUrlを追加
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // 同じドメインの場合はそのまま
      if (urlObj.origin === baseUrl) {
        return url;
      }

      // その他の場合は言語を保持してbaseUrlにリダイレクト
      return `${baseUrl}/${locale}`;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

// Helper function to check which OAuth providers are available
export function getAvailableProviders() {
  return {
    google: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    github: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    credentials: true, // Always available
  };
}
