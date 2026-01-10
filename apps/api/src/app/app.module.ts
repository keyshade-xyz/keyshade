import { Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { AppController } from './app.controller'
import { ConfigModule } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { AuthModule } from '@/auth/auth.module'
import { PrismaModule } from '@/prisma/prisma.module'
import { CommonModule } from '@/common/common.module'
import { MailModule } from '@/mail/mail.module'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '@/auth/guard/auth/auth.guard'
import { UserModule } from '@/user/user.module'
import { ProjectModule } from '@/project/project.module'
import { EnvironmentModule } from '@/environment/environment.module'
import { WorkspaceModule } from '@/workspace/workspace.module'
import { WorkspaceRoleModule } from '@/workspace-role/workspace-role.module'
import { EventModule } from '@/event/event.module'
import { VariableModule } from '@/variable/variable.module'
import { SocketModule } from '@/socket/socket.module'
import { ProviderModule } from '@/provider/provider.module'
import { ScheduleModule } from '@nestjs/schedule'
import { EnvSchema } from '@/common/env/env.schema'
import { IntegrationModule } from '@/integration/integration.module'
import { FeedbackModule } from '@/feedback/feedback.module'
import { CacheModule } from '@/cache/cache.module'
import { WorkspaceMembershipModule } from '@/workspace-membership/workspace-membership.module'
import { PaymentGatewayModule } from '@/payment-gateway/payment-gateway.module'
import { ShareSecretModule } from '@/share-secret/share-secret.module'
import { REDIS_CLIENT } from '@/provider/redis.provider'
import { RedisClientType } from 'redis'
import { FileUploadModule } from '@/file-upload/file-upload.module'
import { SessionModule } from '@/session/session.module'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    UserModule,
    ProjectModule,
    EnvironmentModule,
    WorkspaceModule,
    WorkspaceRoleModule,
    EventModule,
    VariableModule,
    SocketModule,
    ProviderModule,
    IntegrationModule,
    FeedbackModule,
    CacheModule,
    WorkspaceMembershipModule,
    PaymentGatewayModule,
    ShareSecretModule,
    FileUploadModule,
    SessionModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: { publisher: RedisClientType }
  ) {}

  async onModuleDestroy() {
    const pub = this.redisClient.publisher

    if (!pub) return

    // node-redis v4 exposes `isOpen`; only quit when connected
    if (typeof pub.isOpen === 'boolean' && !pub.isOpen) return

    try {
      await pub.quit()
    } catch (err: any) {
      // Ignore "The client is closed" during shutdown
      if (!err || !/The client is closed/i.test(String(err.message))) {
        throw err
      }
    }
  }
}
