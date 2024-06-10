import { Otp, PrismaClient, User } from '@prisma/client'

const OTP_EXPIRY = 5 * 60 * 1000 // 5 minutes

export default async function generateOtp(
  email: User['email'],
  userId: User['id'],
  prisma: PrismaClient
): Promise<Otp> {
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
          email
        }
      }
    }
  })

  return otp
}
