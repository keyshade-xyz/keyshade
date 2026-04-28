import { IsOptional, IsString } from 'class-validator'
import { ConfigName } from '@/decorators/config-name.decorator'
export class CreateEnvironment {
  @ConfigName(3)
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
