import { PartialType } from '@nestjs/swagger'
import { CreateApiKey } from '../create.api-key/create.api-key'

export class UpdateApiKey extends PartialType(CreateApiKey) {}
