import { PrismaClient, User } from '@prisma/client'
import { randomUUID } from 'crypto'

const OTP_EXPIRY = 5 * 60 * 1000 // 5 minutes

export default async function generateOtp(
  email: User['email'],
  userId: User['id'],
  prisma: PrismaClient
): Promise<{ code: string; expiresAt: Date }> {
  const otp = await prisma.otp.upsert({
    where: {
      userId: userId
    },
    update: {
      code: randomUUID().slice(0, 6).toUpperCase(),
      expiresAt: new Date(new Date().getTime() + OTP_EXPIRY)
    },
    create: {
      code: randomUUID().slice(0, 6).toUpperCase(),
      expiresAt: new Date(new Date().getTime() + OTP_EXPIRY),
      user: {
        connect: {
          email
        }
      }
    }
  })

  return { code: otp.code, expiresAt: otp.expiresAt }
}
