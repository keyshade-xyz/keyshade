'use server'

import { cookies } from 'next/headers'

export async function clearAuthCookies() {
   
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('isOnboardingFinished')
}
