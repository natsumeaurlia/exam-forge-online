import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Clear all auth-related cookies
  const cookieStore = cookies();

  // NextAuth session cookies
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.csrf-token');
  cookieStore.delete('__Secure-next-auth.csrf-token');
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('__Secure-next-auth.callback-url');

  return NextResponse.json({ success: true });
}
