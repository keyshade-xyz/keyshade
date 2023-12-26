import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { SupabaseModule } from '../supabase/supabase.module'
import { ConfigModule } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CommonModule } from '../common/common.module'
import { ResendModule } from '../resend/resend.module'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '../auth/auth.guard'
import { UserModule } from '../user/user.module'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PassportModule,
    SupabaseModule,
    AuthModule,
    PrismaModule,
    CommonModule,
    ResendModule,
    SupabaseModule,
    UserModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule {}
