import { Controller, Post, Body } from '@nestjs/common'
import { Public } from '@/decorators/public.decorator'
import { FeedbackService } from './feedback.service'

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post()
  async registerFeedback(
    @Body() feedbackData: { feedback: string }
  ): Promise<void> {
    await this.feedbackService.registerFeedback(feedbackData.feedback)
  }
}
