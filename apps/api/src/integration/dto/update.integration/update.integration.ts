import { PartialType } from '@nestjs/swagger'
import { CreateIntegration } from '../create.integration/create.integration'

export class UpdateIntegration extends PartialType(CreateIntegration) {}
