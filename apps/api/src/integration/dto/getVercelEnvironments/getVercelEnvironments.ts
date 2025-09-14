import { IsString } from 'class-validator'

export class GetVercelEnvironments {
  @IsString()
  token: string

  @IsString()
  projectId: string
}
