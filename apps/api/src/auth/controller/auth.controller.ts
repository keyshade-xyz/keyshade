import { Controller, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { UserAuthenticatedResponse } from '../auth.types'
import { Public } from '../../decorators/public.decorator'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('Auth Controller')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('send-otp/:email')
  @ApiOperation({
    summary: 'Send OTP',
    description:
      'This endpoint sends OTPs to an email address. The OTP can then be used to generate valid tokens'
  })
  @ApiParam({
    name: 'email',
    description: 'Email to send OTP',
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Send OTP successfully'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email is invalid'
  })
  async sendOtp(
    @Param('email')
    email: string
  ): Promise<void> {
    await this.authService.sendOtp(email)
  }

  @Public()
  @Post('validate-otp')
  @ApiOperation({
    summary: 'Validate OTP',
    description:
      'This endpoint validates OTPs. If the OTP is valid, it returns a valid token along with the user details'
  })
  @ApiParam({
    name: 'email',
    description: 'Email to send OTP',
    required: true
  })
  @ApiParam({
    name: 'otp',
    description: 'OTP to validate',
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validate OTP successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Email not found'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'OTP is invalid'
  })
  async validateOtp(
    @Query('email') email: string,
    @Query('otp') otp: string
  ): Promise<UserAuthenticatedResponse> {
    return await this.authService.validateOtp(email, otp)
  }
}
