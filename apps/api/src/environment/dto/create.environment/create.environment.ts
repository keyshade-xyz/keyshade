import { IsOptional, IsString } from 'class-validator'
import { TrimmedMinLengthString } from '@/decorators/trimmed-minlength-string.decorator'
export class CreateEnvironment {
  @IsString()
  @TrimmedMinLengthString(3)
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
