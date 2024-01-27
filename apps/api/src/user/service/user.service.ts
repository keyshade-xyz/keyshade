import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { User } from '@prisma/client'
import { excludeFields } from '../../common/exclude-fields'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto } from '../dto/create.user/create.user'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    // @Inject(USER_REPOSITORY) private readonly repository: IUserRepository
    private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  async getSelf(user: User) {
    return excludeFields(user, 'isActive')
  }

  async updateSelf(user: User, dto: UpdateUserDto, finishOnboarding: boolean) {
    const data = {
      name: dto?.name,
      profilePictureUrl: dto?.profilePictureUrl,
      isOnboardingFinished: finishOnboarding
    }
    this.log.log(`Updating user ${user.id} with data ${dto}`)
    return excludeFields(
      await this.prisma.user.update({
        where: {
          id: user.id
        },
        data
      }),
      'isActive'
    )
  }

  async updateUser(
    userId: string,
    dto: UpdateUserDto,
    finishOnboarding: boolean
  ) {
    const data = {
      name: dto.name,
      profilePictureUrl: dto.profilePictureUrl,
      isAdmin: dto.isAdmin,
      isActive: dto.isActive,
      isOnboardingFinished: finishOnboarding
    }
    this.log.log(`Updating user ${userId} with data ${dto}`)
    return await this.prisma.user.update({
      where: {
        id: userId
      },
      data
    })
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
    // Delete the user's default workspace
    await this.prisma.workspace.delete({
      where: {
        id: userId,
        isDefault: true
      }
    })

    // Delete the user
    await this.prisma.user.delete({
      where: {
        id: userId
      }
    })
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

    // Create the user
    const newUser = await this.prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        isActive: user.isActive ?? true,
        isOnboardingFinished: user.isOnboardingFinished ?? true,
        isAdmin: user.isAdmin ?? false
      }
    })
    this.log.log(`Created user with email ${user.email}`)

    // Create the user's default workspace
    await this.prisma.workspace.create({
      data: {
        name: 'Default',
        isDefault: true,
        ownerId: newUser.id,
        lastUpdatedBy: {
          connect: {
            id: newUser.id
          }
        }
      }
    })
    this.log.log(`Created user's default workspace`)

    await this.mailService.accountLoginEmail(newUser.email)
    this.log.log(`Sent login email to ${user.email}`)

    return newUser
  }
}
