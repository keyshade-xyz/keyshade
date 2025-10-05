import { Module } from '@nestjs/common'
import { UserController } from './controller/user.controller'
import { UserService } from './service/user.service'
import { PersonalAccessTokenController } from '@/user/controller/user-access-token.controller'
import { PersonalAccessTokenService } from '@/user/service/user-access-token.service'

@Module({
  controllers: [UserController, PersonalAccessTokenController],
  providers: [UserService, PersonalAccessTokenService]
})
export class UserModule {}
