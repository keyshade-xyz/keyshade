import { Module } from '@nestjs/common'
import { UserController } from './controller/user.controller'
import { UserService } from './service/user.service'
import { USER_REPOSITORY } from './repository/interface.repository'
import { UserRepository } from './repository/user.repository'

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository
    }
  ],
  exports: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository
    }
  ]
})
export class UserModule {}
