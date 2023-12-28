import { Inject, Injectable, Logger } from '@nestjs/common'
import { PrismaRepository } from '../prisma/prisma.repository'
import { UpdateUserDto } from './dto/update.user/update.user'
import { User } from '@prisma/client'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    @Inject('PrismaRepository') private readonly repository: PrismaRepository
  ) {}

  async getSelf(user: User) {
    return this.repository.excludeFields(user, 'isActive')
  }

  async updateSelf(user: User, dto: UpdateUserDto, finishOnboarding: boolean) {
    const data = {
      ...user,
      ...dto,
      isOnboardingFinished: finishOnboarding
    }
    this.log.log(`Updating user ${user.id} with data ${dto}`)
    return await this.repository.excludeFields(
      await this.repository.updateUser(user.id, data),
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
    return await this.repository.updateUser(userId, data)
  }

  async getUserById(userId: string) {
    return await this.repository.findUserById(userId)
  }

  async getAllUsers(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<User[]> {
    return await this.repository.findUsers(page, limit, sort, order, search)
  }
}
