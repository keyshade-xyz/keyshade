import { Controller, Post, Body } from '@nestjs/common'
import { Public } from '@/decorators/public.decorator'
import { FeedbackService } from './feedback.service'
import { CreateFeedback } from './dto/create.feedback'

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post()
  async registerFeedback(@Body() dto: CreateFeedback): Promise<void> {
    await this.feedbackService.registerFeedback(dto.feedback)
  }
}
