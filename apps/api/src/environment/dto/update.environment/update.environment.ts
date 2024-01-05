import { PartialType } from '@nestjs/swagger'
import { CreateEnvironment } from '../create.environment/create.environment'

export class UpdateEnvironment extends PartialType(CreateEnvironment) {}
