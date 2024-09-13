import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { AuthProvider, User, Workspace } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '../dto/create.user/create.user'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { EnvSchema } from '@/common/env/env.schema'
import { generateOtp, limitMaxItemsPerPage } from '@/common/util'
import { createUser } from '@/common/user'
import { CacheService } from '@/cache/cache.service'
import { UserWithWorkspace } from '../user.types'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  async onApplicationBootstrap() {
    await this.checkIfAdminExistsOrCreate()
    await this.createDummyUser()
  }

  async getSelf(user: UserWithWorkspace) {
    const defaultWorkspace: Workspace | null =
      await this.prisma.workspace.findFirst({
        where: {
          ownerId: user.id,
          isDefault: true
        }
      })

    return { ...user, defaultWorkspace }
  }

  async updateSelf(user: UserWithWorkspace, dto: UpdateUserDto) {
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

      await this.prisma.userEmailChange.upsert({
        where: {
          otpId: otp.id
        },
        update: {
          newEmail: dto.email
        },
        create: {
          newEmail: dto.email,
          otpId: otp.id
        }
      })

      await this.mailService.sendEmailChangedOtp(dto.email, otp.code)
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id
      },
      data
    })
    await this.cache.setUser({
      ...updatedUser,
      defaultWorkspace: user.defaultWorkspace
    })

    this.log.log(`Updated user ${user.id} with data ${dto}`)

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

      //directly updating email when admin triggered
      await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          email: dto.email,
          authProvider: AuthProvider.EMAIL_OTP
        }
      })
    }

    this.log.log(`Updating user ${userId} with data ${dto}`)
    return this.prisma.user.update({
      where: {
        id: userId
      },
      data
    })
  }

  async validateEmailChangeOtp(
    user: UserWithWorkspace,
    otpCode: string
  ): Promise<User> {
    const otp = await this.prisma.otp.findUnique({
      where: {
        userId: user.id,
        code: otpCode
      }
    })

    if (!otp || otp.expiresAt < new Date()) {
      this.log.log(`OTP expired or invalid`)
      throw new UnauthorizedException('Invalid or expired OTP')
    }
    const userEmailChange = await this.prisma.userEmailChange.findUnique({
      where: {
        otpId: otp.id
      }
    })

    const deleteEmailChangeRecord = this.prisma.userEmailChange.delete({
      where: {
        otpId: otp.id
      }
    })

    const deleteOtp = this.prisma.otp.delete({
      where: {
        userId: user.id,
        code: otpCode
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

  async resendEmailChangeOtp(user: UserWithWorkspace) {
    const oldOtp = await this.prisma.otp.findUnique({
      where: {
        userId: user.id
      },
      include: {
        emailChange: true
      }
    })

    if (!oldOtp?.emailChange) {
      throw new ConflictException(
        `No previous OTP for email change exists for user ${user.id}`
      )
    }

    const newOtp = await generateOtp(user.email, user.id, this.prisma)

    await this.mailService.sendEmailChangedOtp(
      oldOtp.emailChange.newEmail,
      newOtp.code
    )
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
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
    return this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limitMaxItemsPerPage(limit),
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

  async deleteSelf(user: UserWithWorkspace) {
    await this.deleteUserById(user.id)
  }

  async deleteUser(userId: User['id']) {
    await this.deleteUserById(userId)
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

  private async createDummyUser() {
    // @ts-expect-error - This is a test environment
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e') {
      this.log.log('Creating dummy user')

      const user = await this.prisma.user.create({
        data: {
          email: 'johndoe@example.com',
          name: 'John Doe',
          isActive: true,
          isOnboardingFinished: true
        }
      })

      this.log.log('Created dummy user: ', user)
    }
  }

  private async checkIfAdminExistsOrCreate() {
    const parsedEnv = EnvSchema.safeParse(process.env)
    let nodeEnv

    if (!parsedEnv.success) {
      nodeEnv = 'dev' // Default to a valid value or handle appropriately
    } else {
      nodeEnv = parsedEnv.data.NODE_ENV
    }

    if (nodeEnv === 'test' || nodeEnv === 'e2e') {
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
