import { Module } from '@nestjs/common'
import { OnboardingReminderTask } from './onboarding-reminder.task'
import { MailModule } from '@/mail/mail.module'
import { PrismaModule } from '@/prisma/prisma.module'

@Module({
  imports: [MailModule, PrismaModule],
  providers: [OnboardingReminderTask]
})
export class TasksModule {}
