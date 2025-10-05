import { PartialType } from '@nestjs/swagger'
import { CreatePatDto } from '@/user/dto/create.pat/create.pat'

export class UpdatePatDto extends PartialType(CreatePatDto) {}
