import { Module } from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import { FeedbackController } from './controller/feedback.controller'

@Module({
  providers: [FeedbackService],
  controllers: [FeedbackController]
})
export class FeedbackModule {}
