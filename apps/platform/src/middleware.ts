import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()

  const token = cookieStore.get('token')?.value
  const isOnboardingFinished = cookieStore.get('isOnboardingFinished')?.value

  const currentPath = req.nextUrl.pathname

  if (token) {
    try {
      const decodedToken: { exp: number } = jwtDecode(token)
      if (decodedToken.exp * 1000 < Date.now()) {
        const response = NextResponse.redirect(new URL('/auth', req.url))
        response.cookies.delete('token')
        response.cookies.delete('isOnboardingFinished')
        return response
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL('/auth', req.url))
      response.cookies.delete('token')
      response.cookies.delete('isOnboardingFinished')
      return response
    }
  }

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
