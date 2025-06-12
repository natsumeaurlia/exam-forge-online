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

      // callbackUrlがある場合はそれを優先（セキュリティ強化）
      const callbackUrl = urlObj.searchParams.get('callbackUrl');
      if (callbackUrl) {
        // SECURITY: Open redirect攻撃を防ぐため厳格な検証
        try {
          // SECURITY FIX: URL decode and sanitize to prevent encoding bypasses
          const decodedUrl = decodeURIComponent(callbackUrl);

          // SECURITY FIX: Block dangerous schemes and patterns
          const dangerousPatterns = [
            'javascript:',
            'data:',
            'vbscript:',
            'file:',
            'about:',
            '<script',
            'onload=',
            'onerror=',
            '\\',
            '../',
          ];

          if (
            dangerousPatterns.some(pattern =>
              decodedUrl.toLowerCase().includes(pattern.toLowerCase())
            )
          ) {
            // Reject dangerous patterns
            throw new Error('Dangerous URL pattern detected');
          }

          // callbackUrlが相対URLの場合（//evil.com形式の攻撃を防ぐ）
          if (decodedUrl.startsWith('/') && !decodedUrl.startsWith('//')) {
            // SECURITY FIX: Additional path traversal protection
            const normalizedPath = decodedUrl.replace(/\/+/g, '/'); // Normalize multiple slashes
            if (
              normalizedPath.includes('/../') ||
              normalizedPath.includes('..\\')
            ) {
              throw new Error('Path traversal attempt detected');
            }
            // 相対パスのみ許可（プロトコル相対URLを拒否）
            return normalizedPath;
          }

          // callbackUrlが絶対URLの場合、同じドメインかつ同じプロトコルを厳密に検証
          const callbackUrlObj = new URL(decodedUrl);
          const baseUrlObj = new URL(baseUrl);

          if (
            callbackUrlObj.origin === baseUrlObj.origin &&
            callbackUrlObj.protocol === baseUrlObj.protocol &&
            !callbackUrlObj.pathname.includes('/../') // Additional path traversal check
          ) {
            return decodedUrl;
          }
        } catch {
          // 不正なURL形式の場合はデフォルトにフォールバック
        }
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
