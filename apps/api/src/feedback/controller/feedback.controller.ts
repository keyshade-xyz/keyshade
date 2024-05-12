import { Controller, Post, Body } from '@nestjs/common'
import { Public } from '../../decorators/public.decorator'
import { FeedbackService } from '../service/feedback.service'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Feedback Controller')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post()
  async registerFeedback(@Body('feedback') feedback: string): Promise<void> {
    await this.feedbackService.registerFeedback(feedback)
  }
}
