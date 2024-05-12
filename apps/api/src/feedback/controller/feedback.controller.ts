import { Controller, Post, Body, HttpStatus } from '@nestjs/common'
import { Public } from '../../decorators/public.decorator'
import { FeedbackService } from '../service/feedback.service'
import { ApiTags, ApiBody, ApiResponse, ApiOperation } from '@nestjs/swagger'

@ApiTags('Feedback Controller')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Send Feedback message to Admin',
    description: 'This endpoint sends a feedback message to the Admin email.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        feedback: {
          type: 'string',
          example: 'Your feedback message here'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Feedback registered successfully'
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  async registerFeedback(
    @Body() feedbackData: { feedback: string }
  ): Promise<void> {
    await this.feedbackService.registerFeedback(feedbackData.feedback)
  }
}
