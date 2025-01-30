'use server'

import { cookies } from 'next/headers'

export async function clearAuthCookies() {
  // eslint-disable-next-line @typescript-eslint/await-thenable -- we need to await the cookies
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('isOnboardingFinished')
}
