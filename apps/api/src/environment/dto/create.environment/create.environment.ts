import { IsOptional, IsString } from 'class-validator'
import { TrimmedMinLengthString } from '@/decorators/trimmed-minlength-string.decorator'
import { IsName, IsDescriptive } from '@/decorators/validation.decorator'
export class CreateEnvironment {
  @IsString()
  @IsName()
  @TrimmedMinLengthString(3)
  name: string

  @IsString()
  @IsDescriptive()
  @IsOptional()
  description?: string
}
