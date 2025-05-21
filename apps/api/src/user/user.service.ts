import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { UpdateUserDto } from './dto/update.user/update.user'
import { AuthProvider, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from './dto/create.user/create.user'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { EnvSchema } from '@/common/env/env.schema'
import {
  constructErrorBody,
  generateOtp,
  limitMaxItemsPerPage
} from '@/common/util'
import { createUser } from '@/common/user'
import { CacheService } from '@/cache/cache.service'
import { UserWithWorkspace } from './user.types'
import { UpdateSelfRequest } from '@keyshade/schema'
import SlugGenerator from '@/common/slug-generator.service'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    private readonly slugGenerator: SlugGenerator
  ) {}

  async onApplicationBootstrap() {
    await this.checkIfAdminExistsOrCreate()
    await this.createDummyUser()
  }

  async getSelf(user: UserWithWorkspace) {
    this.log.log(`User ${user.id} attempted to fetch their own profile`)
    return user
  }

  async updateSelf(user: UserWithWorkspace, dto: UpdateUserDto) {
    this.log.log(`User ${user.id} attempted to update their own profile`)

    const data: UpdateSelfRequest = {
      name: dto?.name,
      profilePictureUrl: dto?.profilePictureUrl,
      isOnboardingFinished: dto.isOnboardingFinished
    }

    if (dto?.email) {
      this.log.log(
        `User ${user.id} attempted to update their email to ${dto.email}`
      )
      const userExists =
        (await this.prisma.user.count({
          where: {
            email: dto.email.toLowerCase()
          }
        })) > 0

      if (userExists) {
        const errorMessage = `Can not update email to ${dto.email} as it already exists`
        this.log.error(errorMessage)
        throw new ConflictException(
          constructErrorBody('Email already exists', errorMessage)
        )
      }

      this.log.log(`Generating OTP for user ${user.id} to change email`)
      const otp = await generateOtp(user.email, user.id, this.prisma)
      this.log.log(`Generated OTP for user ${user.id} to change email`)

      this.log.log(`Creating email change record for user ${user.id}`)
      await this.prisma.userEmailChange.upsert({
        where: {
          otpId: otp.id
        },
        update: {
          newEmail: dto.email.toLowerCase()
        },
        create: {
          newEmail: dto.email.toLowerCase(),
          otpId: otp.id
        }
      })

      this.log.log(`Sending email change OTP to user ${user.id}`)
      await this.mailService.sendEmailChangedOtp(dto.email, otp.code)
    }

    this.log.log(`Updating user ${user.id} with data ${data}`)
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        name: dto?.name,
        profilePictureUrl: dto?.profilePictureUrl,
        isOnboardingFinished: dto.isOnboardingFinished
      }
    })
    this.log.log(`Updated user ${user.id} with data ${data}`)

    let updatedEmailPreferences
    if (dto.emailPreferences) {
      updatedEmailPreferences = await this.prisma.emailPreference.update({
        where: { userId: user.id },
        data: {
          marketing: dto.emailPreferences?.marketing,
          activity: dto.emailPreferences?.activity,
          critical: dto.emailPreferences?.critical
        }
      })
    }
    this.log.log(
      `Updated email preference for user ${user.id} ${JSON.stringify(dto.emailPreferences)}`
    )

    await this.cache.setUser({
      ...updatedUser,
      defaultWorkspace: user.defaultWorkspace,
      emailPreference: user.emailPreference
    })

    return { ...updatedUser, emailPreference: updatedEmailPreferences }
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
            email: dto.email.toLowerCase()
          }
        })) > 0

      if (userExists) {
        const errorMessage = `Can not update email to ${dto.email} as it already exists`
        this.log.error(errorMessage)
        throw new ConflictException(
          constructErrorBody('Email already exists', errorMessage)
        )
      }

      //directly updating email when admin triggered
      await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          email: dto.email.toLowerCase(),
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
    this.log.log(`User ${user.id} attempted to validate OTP for email change`)

    this.log.log(`Checking if OTP is valid for user ${user.id}`)
    const otp = await this.prisma.otp.findUnique({
      where: {
        userId: user.id,
        code: otpCode
      }
    })

    if (!otp || otp.expiresAt < new Date()) {
      this.log.error(`OTP ${otpCode} is invalid or expired for user ${user.id}`)
      throw new UnauthorizedException(
        constructErrorBody(
          'Invalid OTP',
          'The OTP has either exipred or is invalid '
        )
      )
    }

    this.log.log(
      `OTP ${otpCode} is valid for user ${
        user.id
      }, checking email change record`
    )
    const userEmailChange = await this.prisma.userEmailChange.findUnique({
      where: {
        otpId: otp.id
      }
    })

    if (!userEmailChange) {
      this.log.error(`Email change record not found for OTP ${otpCode}`)
      throw new UnauthorizedException(
        constructErrorBody(
          'Invalid OTP',
          'The OTP has either exipred or is invalid '
        )
      )
    }

    this.log.log(
      `Email change record found for OTP ${otpCode}, checking if email is already in use`
    )
    const emailExists =
      (await this.prisma.user.count({
        where: {
          email: userEmailChange.newEmail.toLowerCase()
        }
      })) > 0

    if (emailExists) {
      const errorMessage = `Can not update email to ${userEmailChange.newEmail} as it already exists`
      this.log.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Email already exists', errorMessage)
      )
    }

    this.log.log(
      `Email ${userEmailChange.newEmail} is not in use, updating user ${user.id}`
    )
    const deleteEmailChangeRecord = this.prisma.userEmailChange.delete({
      where: {
        otpId: otp.id
      }
    })

    this.log.log(`Deleting OTP ${otpCode} for user ${user.id}`)
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
        email: userEmailChange.newEmail.toLowerCase(),
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
    this.log.log(`User ${user.id} requested to resend OTP for email change`)

    this.log.log(`Getting old OTP for user ${user.id}`)
    const oldOtp = await this.prisma.otp.findUnique({
      where: {
        userId: user.id
      },
      include: {
        emailChange: true
      }
    })

    if (!oldOtp || !oldOtp.emailChange) {
      this.log.error(`No OTP found for user ${user.id}`)
      throw new ConflictException(
        constructErrorBody(
          'No OTP for email change exists',
          `Seems like you did not register for an email change`
        )
      )
    }

    this.log.log(`Generating new OTP for user ${user.id}`)
    const newOtp = await generateOtp(user.email, user.id, this.prisma)
    this.log.log(`Generated new OTP for user ${user.id}`)

    this.log.log(`Sending new OTP to user ${user.id}`)
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
              contains: search.toLowerCase()
            }
          }
        ]
      }
    })
  }

  async deleteSelf(user: UserWithWorkspace) {
    this.log.log(`User ${user.id} attempted to delete their own account`)
    await this.deleteUserById(user.id)
    this.log.log(`User ${user.id} deleted their own account`)
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

  async createUser(dto: CreateUserDto) {
    this.log.log(`Creating user with email ${dto.email}`)

    // Check for duplicate user
    const checkDuplicateUser =
      (await this.prisma.user.count({
        where: {
          email: dto.email.toLowerCase()
        }
      })) > 0
    if (checkDuplicateUser) {
      this.log.error(`User already exists with email ${dto.email}`)
      throw new ConflictException(
        constructErrorBody(
          'User already exists with this email',
          `Can not create user with email ${dto.email} as it already exists`
        )
      )
    }

    // Create the user's default workspace along with user
    const createdUser = await createUser(
      { authProvider: AuthProvider.EMAIL_OTP, ...dto },
      this.prisma,
      this.slugGenerator
    )
    this.log.log(`Created user with email ${createdUser.email}`)

    await this.mailService.accountLoginEmail(
      createdUser.email,
      createdUser.name,
      process.env.PLATFORM_FRONTEND_URL
    )
    this.log.log(`Sent login email to ${createdUser.email}`)

    return createdUser
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
