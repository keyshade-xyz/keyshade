import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const cookieStore = cookies()

  const token = (await cookieStore).has('token')
  const isOnboardingFinished = (await cookieStore).get(
    'isOnboardingFinished'
  )?.value

  const currentPath = req.nextUrl.pathname

  if (
    !token &&
    currentPath.split('/')[1] !== 'auth' &&
    isOnboardingFinished !== 'true'
  ) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }
  if (
    token &&
    currentPath.split('/')[2] !== 'account-details' &&
    isOnboardingFinished === 'false'
  ) {
    return NextResponse.redirect(new URL('/auth/account-details', req.url))
  }
  if (
    token &&
    currentPath.split('/')[1] === 'auth' &&
    isOnboardingFinished === 'true'
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/project/:path*', '/teams', '/settings', '/auth/:path*']
}
