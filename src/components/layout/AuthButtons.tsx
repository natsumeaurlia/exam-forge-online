"use client"

import { Button } from "@/components/ui/button"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuthButtonsProps {
  loginText: string
  signupText: string
  lng: string
}

export function AuthButtons({ loginText, signupText, lng }: AuthButtonsProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <div className="w-16 h-9 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-9 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {session.user?.name && (
                <p className="font-medium">{session.user.name}</p>
              )}
              {session.user?.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(event) => {
              event.preventDefault()
              router.push(`/${lng}/auth/signout`)
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>ログアウト</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        onClick={() => router.push(`/${lng}/auth/signin`)}
      >
        {loginText}
      </Button>
      <Button onClick={() => router.push(`/${lng}/auth/signin`)}>
        {signupText}
      </Button>
    </div>
  )
}