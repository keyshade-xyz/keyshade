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
    if (!feedback) {
      throw new BadRequestException('Feedback cannot be null')
    }
    const adminEmail = 'admin@keyshade.xyz'

    await this.mailService.feedbackEmail(adminEmail, feedback)
  }
}
