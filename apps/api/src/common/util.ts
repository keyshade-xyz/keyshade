import { UserAuthenticatedResponse } from '@/auth/auth.types'
import { UserWithWorkspace } from '@/user/user.types'
import { InternalServerErrorException, Logger } from '@nestjs/common'
import { Otp, PrismaClient, User } from '@prisma/client'
import { Response } from 'express'
import * as crypto from 'crypto'
import { sDecrypt, sEncrypt } from './cryptography'
import { Entry } from './dto/entry.dto'
import { Environment } from '@keyshade/schema'

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
  const logger = new Logger('generateOtp')
  try {
    logger.log(`Generating OTP for user ${userId}`)

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

    logger.log(
      `Generated OTP for user ${userId}. OTP ${otp.id} is valid until ${otp.expiresAt}`
    )

    return otp
  } catch (error) {
    logger.error(`Error generating OTP for user ${userId}`)
    throw new InternalServerErrorException(
      constructErrorBody(
        'Error generating OTP',
        'An error occurred while generating the OTP.'
      )
    )
  }
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
export const addHoursToDate = (hours?: string | number): Date | null => {
  if (!hours || hours === 'never') return null

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

/**
 * Wraps a promise-returning function in a call that times the duration of the request.
 *
 * @param func - The function to call.
 * @returns A promise that resolves to an object with the response of the function and the duration of the request.
 */
export const makeTimedRequest = async <T>(
  func: () => Promise<T>
): Promise<{ response: T; duration: number }> => {
  const startTime = Date.now()
  const response = await func()
  const endTime = Date.now()
  const duration = endTime - startTime

  return {
    response,
    duration
  }
}

/**
 * Encrypts the given metadata.
 *
 * This function serializes the metadata into a JSON string and then encrypts it.
 * If the metadata is not provided, it returns undefined.
 *
 * @param metadata - The metadata to encrypt.
 * @returns The encrypted metadata as a string, or undefined if no metadata is provided.
 */
export const encryptMetadata = (
  metadata: Record<string, unknown>
): string | undefined => {
  if (!metadata) {
    return undefined
  }
  return sEncrypt(JSON.stringify(metadata))
}

/**
 * Decrypts the given encrypted metadata.
 *
 * This function decrypts the given string and then parses it into a JSON object.
 * If the given string is empty, it returns undefined.
 *
 * @param encryptedMetadata - The encrypted metadata to decrypt.
 * @returns The decrypted metadata as a JSON object, or undefined if the given string is empty.
 */
export const decryptMetadata = <T extends Record<string, unknown>>(
  encryptedMetadata: string
): T | undefined => {
  if (!encryptedMetadata) {
    return undefined
  }
  return JSON.parse(sDecrypt(encryptedMetadata))
}

/**
 * Maps an array of entries into an object where the keys are the environment names
 * and the values are the entry values.
 *
 * If the given array is empty, it returns an empty object.
 *
 * @param entries - The array of entries to map.
 * @returns An object with the environment names as keys and the entry values as values.
 */
export const mapEntriesToEventMetadata = (
  entries?: Entry[]
): Record<Environment['name'], string> => {
  return entries
    ? entries.reduce(
        (acc, entry) => {
          acc[entry.environmentSlug] = entry.value
          return acc
        },
        {} as Record<string, string>
      )
    : {}
}

/**
 * Generates a random referral code that is unique for all users.
 *
 * @param prisma A PrismaClient instance
 * @returns A string representing the generated referral code
 * @throws {InternalServerErrorException} If it cannot generate a unique referral code
 */
export const generateReferralCode = async (
  prisma: PrismaClient
): Promise<string> => {
  const logger = new Logger('generateReferralCode')
  logger.log('Generating referral code')
  let referralCode: string | null
  let tries = 0

  do {
    referralCode = crypto
      .randomBytes(6)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
    tries++
  } while (
    (await prisma.user.count({
      where: { referralCode }
    })) > 0 &&
    tries < 10
  )

  if (tries === 10) {
    logger.error('Ran out of referral codes')
    throw new InternalServerErrorException(
      constructErrorBody(
        'Ran out of referral codes',
        'Could not generate a unique referral code'
      )
    )
  }

  logger.log(`Generated referral code: ${referralCode} in ${tries} tries`)

  return referralCode
}

export const convertBufferToArrayBuffer = (
  buffer: Buffer<ArrayBufferLike>
): ArrayBuffer => {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer
}
