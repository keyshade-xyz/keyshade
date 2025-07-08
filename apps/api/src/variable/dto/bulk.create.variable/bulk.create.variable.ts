import { Type } from 'class-transformer'
import { ValidateNested, ArrayMinSize } from 'class-validator'
import { CreateVariable } from '../create.variable/create.variable'

export class BulkCreateVariableDto {
  @ValidateNested({ each: true })
  @Type(() => CreateVariable)
  @ArrayMinSize(1)
  variables: CreateVariable[]
}
