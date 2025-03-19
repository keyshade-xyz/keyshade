import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)

  constructor(
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  /**
   * Registers a feedback to be sent to the admin's email.
   * @param feedback The feedback to be sent.
   * @throws {BadRequestException} If the feedback is null or empty.
   */
  async registerFeedback(feedback: string): Promise<void> {
    this.logger.log(`Registering feedback: ${feedback}`)

    if (!feedback || feedback.trim().length === 0) {
      this.logger.error('Empty feedback')
      throw new BadRequestException(
        constructErrorBody(
          'Empty feedback',
          'Sadly, empty feedback is not allowed'
        )
      )
    }
    const adminEmail = process.env.FEEDBACK_FORWARD_EMAIL

    this.logger.log(`Sending feedback to ${adminEmail}`)
    await this.mailService.feedbackEmail(adminEmail, feedback.trim())
    this.logger.log('Feedback sent successfully')
  }
}
