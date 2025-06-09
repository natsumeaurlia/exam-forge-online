import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
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

        if (!user) {
          return null;
        }

        // パスワード認証の場合は、実際のプロジェクトではパスワードハッシュ化が必要
        // 今回はデモ用なので簡単な実装
        if (credentials.password === 'password') {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
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
      // サインイン後は常にダッシュボードにリダイレクト
      if (url.includes('/auth/')) {
        // URLから言語パラメータを抽出（例: /ja/auth/signin から ja を取得）
        const langMatch = url.match(/\/([a-z]{2})\/auth/);
        const lng = langMatch ? langMatch[1] : 'ja';
        return `${baseUrl}/${lng}/dashboard`;
      }
      // 相対URLの場合はbaseUrlを追加
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // 同じドメインの場合はそのまま
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // その他の場合はbaseUrlにリダイレクト
      return baseUrl;
    },
  },
};
