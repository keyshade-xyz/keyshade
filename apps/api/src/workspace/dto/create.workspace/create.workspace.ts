import { IsOptional, IsString } from 'class-validator'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'

export class CreateWorkspace {
  @IsString()
  @NonEmptyTrimmedString()
  name: string

  @IsString()
  @IsOptional()
  icon?: string
}
