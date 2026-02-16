import { IsOptional, IsString } from 'class-validator'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'
import { IsASCII } from '@/decorators/validation.decorator'

export class CreateWorkspace {
  @IsString()
  @IsASCII()
  @NonEmptyTrimmedString()
  name: string

  @IsString()
  @IsOptional()
  icon?: string
}
