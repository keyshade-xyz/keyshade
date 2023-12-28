import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { PrismaRepository } from '../prisma/prisma.repository'

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: 'PrismaRepository',
      useClass: PrismaRepository
    }
  ]
})
export class UserModule {}
