import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from '@nestjs/common'
import { AuthService } from '../service/auth.service'
import { UserAuthenticatedResponse } from '../auth.types'
import { Public } from '../../decorators/public.decorator'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { GithubOAuthStrategyFactory } from '../../config/factory/github/github-strategy.factory'

@ApiTags('Auth Controller')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private githubOAuthStrategyFactory: GithubOAuthStrategyFactory
  ) {}

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

  /* istanbul ignore next */
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

  /* istanbul ignore next */
  @Public()
  @Get('github')
  @ApiOperation({
    summary: 'Github OAuth',
    description:
      'This endpoint validates Github OAuth. If the OAuth is valid, it returns a valid token along with the user details'
  })
  async githubOAuthLogin(@Res() res) {
    if (!this.githubOAuthStrategyFactory.isOAuthEnabled()) {
      throw new HttpException(
        'GitHub Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.',
        HttpStatus.BAD_REQUEST
      )
    }

    res.status(302).redirect('/api/auth/github/callback')
  }

  /* istanbul ignore next */
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
