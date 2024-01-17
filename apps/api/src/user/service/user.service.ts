import { Injectable, Logger } from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { User } from '@prisma/client'
import { excludeFields } from '../../common/exclude-fields'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    // @Inject(USER_REPOSITORY) private readonly repository: IUserRepository
    private readonly prisma: PrismaService
  ) {}

  async getSelf(user: User) {
    return excludeFields(user, 'isActive')
  }

  async updateSelf(user: User, dto: UpdateUserDto, finishOnboarding: boolean) {
    const data = {
      ...user,
      ...dto,
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
      ...dto,
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
}
