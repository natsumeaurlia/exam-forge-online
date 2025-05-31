'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface SignInPageProps {
  params: Promise<{
    lng: string
  }>
}

export default function SignInPage({ params }: SignInPageProps) {
  const resolvedParams = use(params)
  const [providers, setProviders] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl: `/${resolvedParams.lng}`,
        redirect: false
      })

      if (result?.error) {
        alert('ログインに失敗しました')
      } else if (result?.ok) {
        router.push(`/${resolvedParams.lng}`)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('ログインエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSignIn = (providerId: string) => {
    signIn(providerId, {
      callbackUrl: `/${resolvedParams.lng}`
    })
  }

  if (!providers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにサインイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <button
              onClick={() => router.push(`/${resolvedParams.lng}`)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              ホームに戻る
            </button>
          </p>
        </div>

        <div className="space-y-6">
          {/* OAuth Providers */}
          <div className="space-y-3">
            {Object.values(providers)
              .filter((provider: any) => provider.id !== 'credentials')
              .map((provider: any) => (
                <button
                  key={provider.name}
                  onClick={() => handleProviderSignIn(provider.id)}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {provider.name}でサインイン
                </button>
              ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">または</span>
            </div>
          </div>

          {/* Credentials Form */}
          <form className="space-y-6" onSubmit={handleCredentialsSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {isLoading ? 'サインイン中...' : 'サインイン'}
              </button>
            </div>
          </form>

          {/* Test Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">テスト用アカウント:</h3>
            <p className="text-sm text-blue-600">
              メール: test@example.com<br />
              パスワード: password
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}