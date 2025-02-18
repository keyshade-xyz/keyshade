import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { IMailService, MAIL_SERVICE } from '@/mail/services/interface.service'
import { constructErrorBody } from '@/common/util'

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  /**
   * Registers a feedback to be sent to the admin's email.
   * @param feedback The feedback to be sent.
   * @throws {BadRequestException} If the feedback is null or empty.
   */
  async registerFeedback(feedback: string): Promise<void> {
    if (!feedback || feedback.trim().length === 0) {
      throw new BadRequestException(
        constructErrorBody(
          'Empty feedback',
          'Sadly, empty feedback is not allowed'
        )
      )
    }
    const adminEmail = process.env.FEEDBACK_FORWARD_EMAIL

    await this.mailService.feedbackEmail(adminEmail, feedback.trim())
  }
}
