import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { ConfigModule } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CommonModule } from '../common/common.module'
import { MailModule } from '../mail/mail.module'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '../auth/guard/auth/auth.guard'
import { UserModule } from '../user/user.module'
import { ProjectModule } from '../project/project.module'
import { EnvironmentModule } from '../environment/environment.module'
import { ApiKeyModule } from '../api-key/api-key.module'
import { WorkspaceModule } from '../workspace/workspace.module'
import { WorkspaceRoleModule } from '../workspace-role/workspace-role.module'
import { ApiKeyGuard } from '../auth/guard/api-key/api-key.guard'
import { EventModule } from '../event/event.module'
import { VariableModule } from '../variable/variable.module'
import { ApprovalModule } from '../approval/approval.module'
import { SocketModule } from '../socket/socket.module'
import { ProviderModule } from '../provider/provider.module'
import { ScheduleModule } from '@nestjs/schedule'
import { EnvSchema } from '../common/env/env.schema'
import { IntegrationModule } from '../integration/integration.module'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // For some reason config module is looking for .env in the api directory so defining custom path
      envFilePath: '../../.env',
      validate: EnvSchema.parse,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true
      }
    }),
    ScheduleModule.forRoot(),
    PassportModule,
    AuthModule,
    PrismaModule,
    CommonModule,
    MailModule,
    ApiKeyModule,
    UserModule,
    ProjectModule,
    EnvironmentModule,
    WorkspaceModule,
    WorkspaceRoleModule,
    EventModule,
    VariableModule,
    ApprovalModule,
    SocketModule,
    ProviderModule,
    IntegrationModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard
    }
  ]
})
export class AppModule {}
