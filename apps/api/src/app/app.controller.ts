import { Controller, Get } from '@nestjs/common'
import { Public } from '../decorators/public.decorator'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('App Controller')
@Controller()
export class AppController {
  @Get('health')
  @Public()
  health(): string {
    return 'UP'
  }
}
