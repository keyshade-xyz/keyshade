import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { ResendModule } from '../resend/resend.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    SupabaseModule,
    AuthModule,
    PrismaModule,
    CommonModule,
    ResendModule,
    SupabaseModule
  ],
  providers: [],
})
export class AppModule {}
