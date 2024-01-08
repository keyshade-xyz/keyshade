import {
  HttpException,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common'
import { UpdateUserDto } from '../dto/update.user/update.user'
import { User } from '@prisma/client'
import {
  IUserRepository,
  USER_REPOSITORY
} from '../repository/interface.repository'
import { excludeFields } from '../../common/exclude-fields'
import { ICreateUserDTO } from '../dto/create.user/create.user'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name)

  constructor(
    @Inject(USER_REPOSITORY) private readonly repository: IUserRepository,
    @Inject(MAIL_SERVICE) private readonly resendService: IMailService
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

  async createUser(user: ICreateUserDTO) {
    this.log.log(`Creating user with email ${user.email}`)
    const checkDuplicateUser = await this.repository.findUserByEmail(user.email)
    if (checkDuplicateUser) {
      throw new HttpException('User already exists', 400)
    }

    const newUser = await this.repository.createUserByAdmin(user)
    this.log.log(`Created user with email ${user.email}`)

    await this.resendService.accountLoginEmail(newUser.email)
    this.log.log(`Sent login email to ${user.email}`)

    return newUser
  }
}
