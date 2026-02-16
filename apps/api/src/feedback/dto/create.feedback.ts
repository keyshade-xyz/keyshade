import { IsString, IsNotEmpty } from 'class-validator'
import { IsASCII } from '@/decorators/validation.decorator'

export class CreateFeedback {
  @IsString()
  @IsNotEmpty()
  @IsASCII()
  feedback: string
}
