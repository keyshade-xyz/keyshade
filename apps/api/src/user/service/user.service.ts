import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { User } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserDto } from '../dto/create.user/create.user'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'
import createUser from '../../common/create-user'

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
    this.log.log(`Updating user ${user.id} with data ${dto}`)
    return await this.prisma.user.update({
      where: {
        id: user.id
      },
      data
    })
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const data = {
      name: dto.name,
      profilePictureUrl: dto.profilePictureUrl,
      isAdmin: dto.isAdmin,
      isActive: dto.isActive,
      isOnboardingFinished: dto.isOnboardingFinished
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

    // Create the user's default workspace
    const newUser = await createUser(user, this.prisma)
    this.log.log(`Created user with email ${user.email}`)

    await this.mailService.accountLoginEmail(newUser.email)
    this.log.log(`Sent login email to ${user.email}`)

    return newUser
  }

  private async checkIfAdminExistsOrCreate() {
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
