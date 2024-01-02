import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { Otp, User } from '@prisma/client'

@Injectable()
export class PrismaRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a user by email
   * @param email the email to search for
   * @returns the user if found, null otherwise
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        email
      }
    })
  }

  /**
   * Find a user by the user id
   * @param id The id of the user to find
   * @returns the user if found, null otherwise
   */
  async findUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        id
      }
    })
  }

  /**
   * Find all users
   * @param page  The page number
   * @param limit  The number of items per page
   * @param sort  The field to sort by
   * @param order  The order to sort by
   * @param search  The search string
   * @returns  The list of users
   */
  async findUsers(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<User[]> {
    return await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort]: order
      },
      where: {
        OR: [
          {
            name: {
              contains: search
            }
          },
          {
            email: {
              contains: search
            }
          }
        ]
      }
    })
  }

  /**
   * Create a user with the given email. The onboarding process
   * will aim at updating the user further.
   * @param email The email of the user to create
   * @returns
   */
  async createUser(email: string): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email
      }
    })
  }

  /**
   * Update an existing user
   * @param id ID of the user to update
   * @param data The data to update
   * @returns The updated user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await this.prisma.user.update({
      where: {
        id
      },
      data
    })
  }

  /**
   * Delete a user by id
   * @param id The id of the user to delete
   * @returns The deleted user
   */
  async deleteUser(id: string): Promise<User> {
    return await this.prisma.user.delete({
      where: {
        id
      }
    })
  }

  /**
   * An OTP is valid if it exists, is not expired, and is associated with the given email
   * @param email the email against which to check the OTP
   * @param otp the OTP code to check
   * @returns returns true if the OTP is valid, false otherwise
   */
  async isOtpValid(email: string, otp: string): Promise<boolean> {
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
    email: string,
    otp: string,
    expiresAfter: number
  ): Promise<Otp> {
    const timeNow = new Date()
    await this.invalidateOldOtps(email)
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

  /**
   * Invalidate Old OTPs for a User
   *
   * This method invalidates old OTPs (One-Time Passwords) associated with a user.
   * It finds and deletes OTPs that belong to the user and have not expired yet.
   *
   * @param email - The email address of the user for whom old OTPs should be invalidated.
   *
   * @example
   * ```typescript
   * await invalidateOldOtps('user@example.com');
   * ```
   */
  private async invalidateOldOtps(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    })

    if (user) {
      await this.prisma.otp.deleteMany({
        where: {
          userId: user.id,
          expiresAt: {
            gte: new Date()
          }
        }
      })
    }
  }

  async deleteOtp(email: string, otp: string): Promise<void> {
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

  async excludeFields<T, K extends keyof T>(
    key: T,
    ...fields: K[]
  ): Promise<Partial<T>> {
    return Object.fromEntries(
      Object.entries(key).filter(([k]) => !fields.includes(k as K))
    ) as Partial<T>
  }
}
