import { NextAuthOptions, getServerSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
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
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
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

      // callbackUrlがある場合はそれを優先
      const callbackUrl = urlObj.searchParams.get('callbackUrl');
      if (callbackUrl) {
        // callbackUrlが相対URLの場合
        if (callbackUrl.startsWith('/')) {
          return callbackUrl;
        }
        // callbackUrlが同じドメインの場合
        try {
          const callbackUrlObj = new URL(callbackUrl, baseUrl);
          if (callbackUrlObj.origin === baseUrl) {
            return callbackUrl;
          }
        } catch {}
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
