import { Type } from 'class-transformer'
import { ValidateNested, ArrayMinSize } from 'class-validator'
import { CreateSecret } from '../create.secret/create.secret'

export class BulkCreateSecretDto {
  @ValidateNested({ each: true })
  @Type(() => CreateSecret)
  @ArrayMinSize(1)
  secrets: CreateSecret[]
}
