import { PartialType } from '@nestjs/swagger'
import { CreateWorkspace } from '../create.workspace/create.workspace'

export class UpdateWorkspace extends PartialType(CreateWorkspace) {}
