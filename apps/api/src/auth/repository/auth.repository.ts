import { Otp, User } from '@prisma/client'
import { IAuthRepository } from './interface.repository'
import { PrismaService } from '../../prisma/prisma.service'

export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isOtpValid(email: User['email'], otp: string): Promise<boolean> {
    const timeNow = new Date()
    return (
      (await this.prisma.otp.count({
        where: {
          code: otp,
          user: {
            email
          },
          expiresAt: {
            gt: timeNow
          }
        }
      })) > 0
    )
  }

  async createOtp(
    email: User['email'],
    otp: string,
    expiresAfter: number
  ): Promise<Otp> {
    const timeNow = new Date()
    return await this.prisma.otp.create({
      data: {
        code: otp,
        expiresAt: new Date(timeNow.getTime() + expiresAfter),
        user: {
          connect: {
            email
          }
        }
      }
    })
  }

  async deleteOtp(email: User['email'], otp: string): Promise<void> {
    await this.prisma.otp.delete({
      where: {
        code: otp,
        AND: {
          user: {
            email
          }
        }
      }
    })
  }
}
