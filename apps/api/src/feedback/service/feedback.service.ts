import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import {
  IMailService,
  MAIL_SERVICE
} from '../../mail/services/interface.service'

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService
  ) {}

  async registerFeedback(feedback: string): Promise<void> {
    if (!feedback || feedback.trim().length === 0) {
      throw new BadRequestException('Feedback cannot be null or empty')
    }
    const adminEmail = process.env.FEEDBACK_FORWARD_EMAIL

    await this.mailService.feedbackEmail(adminEmail, feedback.trim())
  }
}
