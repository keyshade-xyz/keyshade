import { Controller, Param, Post, Query } from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { UserAuthenticatedResponse } from '../auth.types'
import { Public } from '../../decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('send-otp/:email')
  async sendOtp(@Param('email') email: string): Promise<void> {
    await this.authService.sendOtp(email)
  }

  @Public()
  @Post('validate-otp')
  async validateOtp(
    @Query('email') email: string,
    @Query('otp') otp: string
  ): Promise<UserAuthenticatedResponse> {
    return await this.authService.validateOtp(email, otp)
  }
}
