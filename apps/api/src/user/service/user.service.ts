import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { User } from '@prisma/client'
import {
  IUserRepository,
  USER_REPOSITORY
} from '../repository/interface.repository'
import { excludeFields } from '../../common/exclude-fields'
import { ICreateUserDto } from '../dto/create.user/create.user'
import { IMailService, MAIL_SERVICE } from '../../mail/services/interface.service'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    @Inject(USER_REPOSITORY) private readonly repository: IUserRepository,
    @Inject(MAIL_SERVICE) private resend: IMailService
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

  async createUser(dto: ICreateUserDto) {
    const data = {
      ...dto
    }
    const checkDuplicate = await this.repository.findUserByEmail(data.email)
    if (checkDuplicate) {
      this.log.error(`User already exists: ${data.email}`)
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST)
    }
    this.log.log(`Creating user with data ${dto}`)
    const user = await this.repository.createUserByAdmin(data);

    this.log.log(`Sending login email to ${user.email}`)
    await this.resend.sendLogInEmail(user.email);

    return excludeFields(user, 'isActive');
  }
}
