import { ArrayMinSize, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'
import { OmitType } from '@nestjs/swagger'
import { CreateVariable } from '@/variable/dto/create.variable/create.variable'

export class BulkCreateVariable {
  @ValidateNested({ each: true })
  @Type(() => BulkVariableEntry)
  @ArrayMinSize(1)
  variables: BulkVariableEntry[]
}

class BulkVariableEntry extends OmitType(CreateVariable, ['entries']) {
  @NonEmptyTrimmedString()
  value: string

  @NonEmptyTrimmedString()
  environmentSlug: string
}
