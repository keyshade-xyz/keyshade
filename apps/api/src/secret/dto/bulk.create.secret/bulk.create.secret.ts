import { Type } from 'class-transformer'
import { ArrayMinSize, ValidateNested } from 'class-validator'
import { CreateSecret } from '../create.secret/create.secret'
import { NonEmptyTrimmedString } from '@/decorators/non-empty-trimmed-string.decorator'
import { OmitType } from '@nestjs/swagger'

export class BulkCreateSecret {
  @ValidateNested({ each: true })
  @Type(() => BulkSecretEntry)
  @ArrayMinSize(1)
  secrets: BulkSecretEntry[]
}

class BulkSecretEntry extends OmitType(CreateSecret, ['entries']) {
  @NonEmptyTrimmedString()
  value: string

  @NonEmptyTrimmedString()
  environmentSlug: string
}
