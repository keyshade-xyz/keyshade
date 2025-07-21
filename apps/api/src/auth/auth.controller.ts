import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnprocessableEntityException,
  UseGuards
} from '@nestjs/common'
import { AuthService } from './service/auth.service'
import { Public } from '@/decorators/public.decorator'
import { AuthGuard } from '@nestjs/passport'
import { GithubOAuthStrategyFactory } from '@/config/factory/github/github-strategy.factory'
import { GoogleOAuthStrategyFactory } from '@/config/factory/google/google-strategy.factory'
import { GitlabOAuthStrategyFactory } from '@/config/factory/gitlab/gitlab-strategy.factory'
import { Response } from 'express'
import { AuthProvider } from '@prisma/client'
import {
  sendOAuthFailureRedirect,
  sendOAuthSuccessRedirect
} from '@/common/redirect'
import { setCookie } from '@/common/util'
import { ThrottlerGuard } from '@nestjs/throttler'

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private authService: AuthService,
    private githubOAuthStrategyFactory: GithubOAuthStrategyFactory,
    private googleOAuthStrategyFactory: GoogleOAuthStrategyFactory,
    private gitlabOAuthStrategyFactory: GitlabOAuthStrategyFactory
  ) {}

  @Public()
  @Post('send-otp/:email')
  async sendOtp(
    @Param('email')
    email: string
  ): Promise<void> {
    await this.authService.sendOtp(email)
  }

  @Public()
  @Post('resend-otp/:email')
  @UseGuards(ThrottlerGuard)
  async resendOtp(
    @Param('email')
    email: string
  ): Promise<void> {
    return await this.authService.resendOtp(email)
  }

  /* istanbul ignore next */
  @Public()
  @Post('validate-otp')
  async validateOtp(
    @Query('email') email: string,
    @Query('otp') otp: string,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request
  ) {
    const sessionData = await this.authService.validateOtp(email, otp, req)
    return setCookie(response, sessionData)
  }

  /* istanbul ignore next */
  @Public()
  @Get('github')
  async githubOAuthLogin(@Res() res: Response) {
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
  async githubOAuthCallback(@Req() req: any, @Res() res: Response) {
    const { emails, displayName: name, photos } = req.user

    if (!emails.length) {
      throw new UnprocessableEntityException(
        'Email information is missing from the OAuth provider data.'
      )
    }
    const email = emails[0].value
    const profilePictureUrl = photos[0]?.value

    await this.handleOAuthProcess(
      email,
      name,
      profilePictureUrl,
      AuthProvider.GITHUB,
      res,
      req
    )
  }

  /* istanbul ignore next */
  @Public()
  @Get('gitlab')
  async gitlabOAuthLogin(@Res() res: Response) {
    if (!this.gitlabOAuthStrategyFactory.isOAuthEnabled()) {
      throw new HttpException(
        'GitLab Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.',
        HttpStatus.BAD_REQUEST
      )
    }

    res.status(302).redirect('/api/auth/gitlab/callback')
  }

  /* istanbul ignore next */
  @Public()
  @Get('gitlab/callback')
  @UseGuards(AuthGuard('gitlab'))
  async gitlabOAuthCallback(@Req() req: any, @Res() res: Response) {
    const { emails, displayName: name, avatarUrl: profilePictureUrl } = req.user

    if (!emails.length) {
      throw new UnprocessableEntityException(
        'Email information is missing from the OAuth provider data.'
      )
    }
    const email = emails[0].value

    await this.handleOAuthProcess(
      email,
      name,
      profilePictureUrl,
      AuthProvider.GITLAB,
      res,
      req
    )
  }

  /* istanbul ignore next */
  @Public()
  @Get('google')
  async googleOAuthLogin(@Res() res: Response) {
    if (!this.googleOAuthStrategyFactory.isOAuthEnabled()) {
      throw new HttpException(
        'Google Auth is not enabled in this environment. Refer to the https://docs.keyshade.xyz/contributing-to-keyshade/environment-variables if you would like to set it up.',
        HttpStatus.BAD_REQUEST
      )
    }

    res.status(302).redirect('/api/auth/google/callback')
  }

  /* istanbul ignore next */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleOAuthCallback(@Req() req: any, @Res() res: Response) {
    const { emails, displayName: name, photos } = req.user

    if (!emails.length) {
      throw new UnprocessableEntityException(
        'Email information is missing from the OAuth provider data.'
      )
    }
    const email = emails[0].value
    const profilePictureUrl = photos[0]?.value

    await this.handleOAuthProcess(
      email,
      name,
      profilePictureUrl,
      AuthProvider.GOOGLE,
      res,
      req
    )
  }

  /* istanbul ignore next */
  private async handleOAuthProcess(
    email: string,
    name: string,
    profilePictureUrl: string,
    oauthProvider: AuthProvider,
    response: Response,
    req?: any
  ) {
    try {
      const { ip, device, location } = await AuthService.parseLoginRequest(req)

      const data = await this.authService.handleOAuthLogin(
        email,
        name,
        profilePictureUrl,
        oauthProvider
      )

      await this.authService.sendLoginNotification(email, {
        ip,
        device,
        location
      })

      const user = setCookie(response, data)
      sendOAuthSuccessRedirect(response, user)
    } catch (error) {
      sendOAuthFailureRedirect(response, JSON.parse(error.message).body)
    }
  }

  @Post('logout')
  async logout(@Res() res: Response): Promise<void> {
    await this.authService.logout(res)
    res.status(HttpStatus.OK).send({ message: 'Logged out successfully' })
  }
}
