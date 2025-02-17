import { UserAuthenticatedResponse } from '@/auth/auth.types'
import { UserWithWorkspace } from '@/user/user.types'
import { Otp, PrismaClient, User } from '@prisma/client'
import { Response } from 'express'

/**
 * Limits the given limit to a maximum number of items per page.
 * This is useful to prevent users from fetching too many items at once.
 * @param limit The limit to check.
 * @param maxLimit The maximum number of items per page (default is 30).
 * @returns The limited number of items per page.
 */
export const limitMaxItemsPerPage = (
  limit: number,
  maxLimit: number = 30
): number => {
  return Math.min(limit, maxLimit)
}

/**
 * Sets a cookie on the given response with the given user's authentication token.
 * The cookie will expire after 7 days.
 * @param response The response to set the cookie on.
 * @param data The user authentication data to set the cookie for.
 * @returns The user data without the authentication token.
 */
export const setCookie = (
  response: Response,
  data: UserAuthenticatedResponse
): UserWithWorkspace => {
  const { token, ...user } = data
  response.cookie('token', `Bearer ${token}`, {
    domain: process.env.DOMAIN ?? 'localhost',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days,
  })
  return user
}

const OTP_EXPIRY = 5 * 60 * 1000 // 5 minutes

/**
 * Generates a new one-time password for the given user.
 * If the user already has an OTP, this will update the existing one.
 * @param email The email of the user to generate the OTP for.
 * @param userId The ID of the user to generate the OTP for.
 * @param prisma The Prisma client to use for the database operations.
 * @returns The generated OTP.
 */
export const generateOtp = async (
  email: User['email'],
  userId: User['id'],
  prisma: PrismaClient
): Promise<Otp> => {
  const otp = await prisma.otp.upsert({
    where: {
      userId: userId
    },
    update: {
      code: BigInt(`0x${crypto.randomUUID().replace(/-/g, '')}`)
        .toString()
        .substring(0, 6),
      expiresAt: new Date(new Date().getTime() + OTP_EXPIRY)
    },
    create: {
      code: BigInt(`0x${crypto.randomUUID().replace(/-/g, '')}`)
        .toString()
        .substring(0, 6),
      expiresAt: new Date(new Date().getTime() + OTP_EXPIRY),
      user: {
        connect: {
          email: email.toLowerCase()
        }
      }
    }
  })

  return otp
}

/**
 * Removes fields from an object
 * @param key  The object to remove fields from
 * @param fields  The fields to remove
 * @returns The object without the removed fields
 */
export const excludeFields = <T, K extends keyof T>(
  key: T,
  ...fields: K[]
): Partial<T> =>
  Object.fromEntries(
    Object.entries(key).filter(([k]) => !fields.includes(k as K))
  ) as Partial<T>

/**
 * Adds the given number of hours to the current date.
 * If the hours is 'never', or not given, the function returns undefined.
 * @param hours The number of hours to add to the current date
 * @returns The new date with the given number of hours added, or undefined if the hours is 'never'
 */
export const addHoursToDate = (hours?: string | number): Date | undefined => {
  if (!hours || hours === 'never') return undefined

  const date = new Date()
  date.setHours(date.getHours() + +hours)
  return date
}

/**
 * Constructs a JSON string representing an error body with a header and body.
 *
 * @param header - The header for the error message.
 * @param body - The body of the error message.
 * @returns A JSON string containing the header and body.
 */

export const constructErrorBody = (header: string, body: string): string => {
  return JSON.stringify({
    header,
    body
  })
}
