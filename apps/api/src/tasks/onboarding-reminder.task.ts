import { Inject, Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { addDays } from 'date-fns'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'

let isRunning = false

// Reminder schedule in days from previous reminder
// Total reminders: 6, sent on days: 3, 9, 16, 26, 41, 56 after joinedOn
const scheduleOffsets = [3, 6, 7, 10, 15, 15]

@Injectable()
export class OnboardingReminderTask {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService
  ) {}

  // runs everyday at 9 a.m.
  //@Cron(CronExpression.EVERY_MINUTE)
  @Cron('0 9 * * *')
  async handleReminders() {
    if (isRunning) return
    isRunning = true

    const allUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        isOnboardingFinished: false,
        noOfReminderSent: { lt: scheduleOffsets.length }
      },
      select: {
        id: true,
        email: true,
        name: true,
        noOfReminderSent: true,
        profilePictureUrl: true,
        isAdmin: true,
        joinedOn: true,
        authProvider: true,
        referredById: true
      }
    })

    try {
      for (const user of allUsers) {
        const reminderIndex = user.noOfReminderSent

        // so it doesn't go beyond the schedule
        if (reminderIndex >= scheduleOffsets.length) continue

        const waitDays = scheduleOffsets
          .slice(0, reminderIndex)
          .reduce((a, b) => a + b, 0)

        const lastSentDate = addDays(user.joinedOn, waitDays)
        const now = new Date()

        if (now < lastSentDate) continue

        try {
          await this.mailService.sendOnboardingReminder(
            user.email,
            user.name,
            reminderIndex + 1
          )

          await this.prisma.user.update({
            where: { id: user.id },
            data: { noOfReminderSent: { increment: 1 } }
          })
        } catch (err) {
          console.error(`Failed to send reminder to ${user.email}:`, err)
        }
      }
    } catch (err) {
      console.error(`Error during reminder task:`, err)
    } finally {
      isRunning = false
    }
  }
}
