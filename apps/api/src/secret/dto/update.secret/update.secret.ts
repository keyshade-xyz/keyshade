import { PartialType } from '@nestjs/swagger'
import { CreateSecret } from '../create.secret/create.secret'

export class UpdateSecret extends PartialType(CreateSecret) {}
