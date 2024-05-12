import { User } from '@prisma/client'
import { Response } from 'express'
import { UserAuthenticatedResponse } from '../auth/auth.types'

/* istanbul ignore next */
export default function setCookie(
  response: Response,
  data: UserAuthenticatedResponse
): User {
  const { token, ...user } = data
  response.cookie('token', `Bearer ${token}`, {
    domain: process.env.DOMAIN ?? 'localhost',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days,
  })
  return user
}
