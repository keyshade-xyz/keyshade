import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { UserAuthenticatedResponse } from '../auth.types'
import { Public } from '../../decorators/public.decorator'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

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

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Github OAuth',
    description:
      'This endpoint validates Github OAuth. If the OAuth is valid, it returns a valid token along with the user details'
  })
  async githubOAuthLogin() {
    /**
     * NOTE:
     * This function does nothing and the oauth redirect is managed my AuthGuard
     * - The 'github' method inside the authguard is managed by passport
     */
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({
    summary: 'Github OAuth Callback',
    description:
      'This endpoint validates Github OAuth. If the OAuth is valid, it returns a valid token along with the user details'
  })
  @ApiParam({
    name: 'code',
    description: 'Code for the Callback',
    required: true
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged in successfully'
  })
  // TODO: Change the Res Code from 500 -> 401, when incorrect code is provided
  async githubOAuthCallback(@Req() req) {
    const { emails, displayName: name, photos } = req.user
    const email = emails[0].value
    const profilePictureUrl = photos[0].value
    return await this.authService.handleGithubOAuth(
      email,
      name,
      profilePictureUrl
    )
  }
}
