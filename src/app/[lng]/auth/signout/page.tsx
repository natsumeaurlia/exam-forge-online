'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, use } from 'react'

interface SignOutPageProps {
  params: Promise<{
    lng: string
  }>
}

export default function SignOutPage({ params }: SignOutPageProps) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      signOut({
        callbackUrl: `/${resolvedParams.lng}`,
        redirect: true
      })
    } else {
      router.push(`/${resolvedParams.lng}`)
    }
  }, [session, resolvedParams.lng, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            サインアウト中...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            お疲れ様でした
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => router.push(`/${resolvedParams.lng}`)}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  )
}