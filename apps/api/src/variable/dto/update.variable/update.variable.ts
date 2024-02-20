import { PartialType } from '@nestjs/swagger'
import { CreateVariable } from '../create.variable/create.variable'

export class UpdateVariable extends PartialType(CreateVariable) {}
