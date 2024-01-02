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
import { AuthGuard } from '../auth/guard/auth.guard'
import { UserModule } from '../user/user.module'
import { ProjectModule } from '../project/project.module'
import { EnvironmentModule } from '../environment/environment.module'

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
    UserModule,
    ProjectModule,
    EnvironmentModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule {}
