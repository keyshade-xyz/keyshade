import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { AuthProvider, User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto } from '../dto/create.user/create.user'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'
import createUser from '../../common/create-user'
import generateOtp from '../../common/generate-otp'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  async onApplicationBootstrap() {
    await this.checkIfAdminExistsOrCreate()
  }

  async getSelf(user: User) {
    return user
  }

  async updateSelf(user: User, dto: UpdateUserDto) {
    const data = {
      name: dto?.name,
      profilePictureUrl: dto?.profilePictureUrl,
      isOnboardingFinished: dto.isOnboardingFinished
    }
    if (dto?.email) {
      const userExists =
        (await this.prisma.user.count({
          where: {
            email: dto.email
          }
        })) > 0

      if (userExists) {
        throw new ConflictException('User with this email already exists')
      }

      const otp = await generateOtp(user.email, user.id, this.prisma)

      await this.prisma.userEmailChange.create({
        data: {
          newEmail: dto.email,
          userId: user.id,
          otp: otp.code,
          expiresOn: otp.expiresAt
        }
      })

      await this.mailService.sendEmailChangedOtp(dto.email, otp.code)
    }

    this.log.log(`Updating user ${user.id} with data ${dto}`)
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id
      },
      data
    })

    return updatedUser
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const data = {
      name: dto.name,
      profilePictureUrl: dto.profilePictureUrl,
      isAdmin: dto.isAdmin,
      isActive: dto.isActive,
      isOnboardingFinished: dto.isOnboardingFinished
    }

    if (dto.email) {
      const userExists =
        (await this.prisma.user.count({
          where: {
            email: dto.email
          }
        })) > 0

      if (userExists) {
        throw new ConflictException('User with this email already exists')
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: userId
        },
        select: {
          email: true
        }
      })

      const otp = await generateOtp(user.email, userId, this.prisma)

      await this.prisma.userEmailChange.create({
        data: {
          newEmail: dto.email,
          userId: userId,
          otp: otp.code,
          expiresOn: otp.expiresAt
        }
      })
    }

    this.log.log(`Updating user ${userId} with data ${dto}`)
    return await this.prisma.user.update({
      where: {
        id: userId
      },
      data
    })
  }

  async validateEmailChangeOtp(user: User, otp: string): Promise<User> {
    const userEmailChange = await this.prisma.userEmailChange.findUnique({
      where: {
        userId_otp: {
          userId: user.id,
          otp: otp
        },
        expiresOn: {
          gt: new Date()
        }
      }
    })

    if (!userEmailChange) {
      this.log.log(`OTP expired or invalid`)
      throw new UnauthorizedException('Invalid or expired OTP')
    }

    const deleteEmailChangeRecord = this.prisma.userEmailChange.delete({
      where: {
        userId_otp: {
          userId: user.id,
          otp: otp
        }
      }
    })

    const deleteOtp = this.prisma.otp.delete({
      where: {
        userId: user.id,
        code: otp
      }
    })

    const updateUserOp = this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        email: userEmailChange.newEmail,
        authProvider: AuthProvider.EMAIL_OTP
      }
    })

    this.log.log(
      `Changing email to ${userEmailChange.newEmail} for user ${user.id}`
    )
    const results = await this.prisma.$transaction([
      deleteEmailChangeRecord,
      deleteOtp,
      updateUserOp
    ])

    return results[2]
  }

  async resendEmailChangeOtp(user: User) {
    const oldOtp = await this.prisma.otp.findUnique({
      where: {
        userId: user.id
      }
    })

    if (!oldOtp) {
      throw new ConflictException(`No previous OTP exists for user ${user.id}`)
    }

    const newOtp = await generateOtp(user.email, user.id, this.prisma)

    const newUserEmailChange = await this.prisma.userEmailChange.update({
      where: {
        userId_otp: {
          userId: user.id,
          otp: oldOtp.code
        }
      },
      data: {
        otp: newOtp.code,
        createdOn: new Date(),
        expiresOn: newOtp.expiresAt
      }
    })

    await this.mailService.sendEmailChangedOtp(
      newUserEmailChange.newEmail,
      newOtp.code
    )
  }

  async getUserById(userId: string) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })
  }

  async getAllUsers(
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

  async deleteSelf(user: User) {
    this.deleteUserById(user.id)
  }

  async deleteUser(userId: User['id']) {
    this.deleteUserById(userId)
  }

  private async deleteUserById(userId: User['id']) {
    await this.prisma.$transaction([
      // Delete the user
      this.prisma.user.delete({
        where: {
          id: userId
        }
      }),

      // Delete the default workspace of this user
      this.prisma.workspace.deleteMany({
        where: {
          ownerId: userId,
          isDefault: true
        }
      })
    ])

    this.log.log(`Deleted user ${userId}`)
  }

  async createUser(user: CreateUserDto) {
    this.log.log(`Creating user with email ${user.email}`)

    // Check for duplicate user
    const checkDuplicateUser =
      (await this.prisma.user.count({
        where: {
          email: user.email
        }
      })) > 0
    if (checkDuplicateUser) {
      throw new ConflictException('User already exists with this email')
    }

    // Create the user's default workspace along with user
    const userWithWorkspace = await createUser(
      { authProvider: AuthProvider.EMAIL_OTP, ...user },
      this.prisma
    )
    this.log.log(`Created user with email ${user.email}`)

    await this.mailService.accountLoginEmail(userWithWorkspace.email)
    this.log.log(`Sent login email to ${user.email}`)

    return userWithWorkspace
  }

  private async checkIfAdminExistsOrCreate() {
    // @ts-expect-error process.env.NODE_ENV parses to 'dev'
    // FIXME
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e') {
      return
    }

    const adminExists =
      (await this.prisma.user.count({
        where: {
          isAdmin: true
        }
      })) > 0

    if (!adminExists) {
      this.log.warn('No admin user found', 'UserService')
      this.log.log('Creating admin user', 'UserService')

      // Create the admin user
      const adminUser = await this.prisma.user.create({
        data: {
          name: 'Admin',
          email: process.env.ADMIN_EMAIL,
          isAdmin: true,
          isActive: true,
          isOnboardingFinished: true
        }
      })

      await this.mailService.adminUserCreateEmail(adminUser.email)
      this.log.log('Created admin user', 'UserService')
      return
    }
    this.log.log('Admin user found', 'UserService')
  }
}
