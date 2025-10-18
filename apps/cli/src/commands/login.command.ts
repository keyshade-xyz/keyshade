import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import BaseCommand from './base.command'
import { confirm, intro, note, outro, spinner, text } from '@clack/prompts'
import z from 'zod'
import chalk from 'chalk'
import ControllerInstance from '@/util/controller-instance'
import { type ValidateOTPResponse } from '@keyshade/schema'
import {
  fetchProfileConfig,
  writeDefaultProfileConfig,
  writeProfileConfig
} from '@/util/configuration'
import {
  clearSpinnerLines,
  handleSIGINT,
  showError,
  showSuccess
} from '@/util/prompt'
import * as os from 'node:os'

interface VerificationResult {
  success: boolean
  data?: ValidateOTPResponse
  errorMessage?: string
}

interface LoginState {
  email: string
  baseUrl: string | null
  verificationCode?: string
}

export default class LoginCommand extends BaseCommand {
  getName(): string {
    return 'login'
  }

  getDescription(): string {
    return 'Login to Keyshade account'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--email <string>',
        description:
          'Your email address to receive the sign-in verification code'
      },
      {
        short: '-b',
        long: '--base-url <string>',
        description: 'Custom Keyshade deployment URL'
      }
    ]
  }

  getUsage(): string {
    return `keyshade login [options]
    
    Log in with predefined email
    keyshade login --email <email>
    
    Log in with a predefined deployment URL
    keyshade login --base-url <api url>
    `
  }

  async action({ options }: CommandActionData): Promise<void> {
    intro(chalk.bgBlue(' Authenticate to Keyshade '))

    try {
      const loginState = await this.gatherLoginInputs(options)
      const verificationResult = await this.performLogin(loginState)
      await this.handleLoginResult(verificationResult, loginState.baseUrl)
    } catch (error) {
      void this.handleLoginError(
        error instanceof Error ? error.message : undefined
      )
    }
  }

  private async gatherLoginInputs(
    options: CommandActionData['options']
  ): Promise<LoginState> {
    const baseUrl = await this.getBaseUrl(options.baseUrl)
    const email = await this.getEmail(options.email)
    return { email, baseUrl }
  }

  private async getBaseUrl(providedBaseUrl?: string): Promise<string | null> {
    if (providedBaseUrl) {
      return providedBaseUrl
    }

    const isCustomDeployment = await confirm({
      message: 'Are you using a custom deployment of Keyshade?',
      initialValue: false
    })

    // Handle Custom Deployment cancellation
    handleSIGINT(isCustomDeployment, 'Login cancelled. Goodbye! 👋')

    if (!isCustomDeployment) {
      return null
    }

    const customBaseUrl = await text({
      message: '🔗 Enter your custom Keyshade deployment URL:',
      placeholder: 'https://your-custom-url.com',
      validate: this.validateURL.bind(this)
    })
    // Handle Custom URL cancellation
    handleSIGINT(customBaseUrl, 'Login cancelled. Goodbye! 👋')
    return customBaseUrl as string
  }

  private async getEmail(providedEmail?: string): Promise<string> {
    if (providedEmail) {
      return providedEmail
    }

    const userEmail = await text({
      message: '📧 Enter your email address to receive a verification code:',
      placeholder: 'you@example.com',
      validate: this.validateEmail.bind(this)
    })

    handleSIGINT(userEmail, 'Login cancelled. Goodbye! 👋')
    return userEmail as string
  }

  private async performLogin(
    loginState: LoginState
  ): Promise<VerificationResult> {
    // Send verification code
    const emailResult = await this.sendVerificationCodeWithSpinner(
      loginState.email,
      loginState.baseUrl
    )

    if (!emailResult.success) {
      return emailResult
    }

    // Get verification code from user
    const verificationCode = await this.getVerificationCode()

    // Verify the code
    return await this.verifyCodeWithSpinner(
      verificationCode,
      loginState.email,
      loginState.baseUrl
    )
  }

  private async sendVerificationCodeWithSpinner(
    email: string,
    baseUrl: string | null
  ): Promise<VerificationResult> {
    const loading = spinner()
    loading.start('Sending verification code to your email...')

    try {
      const result = await this.sendVerificationCode(email, baseUrl)
      loading.stop()
      clearSpinnerLines()

      if (result.success) {
        await showSuccess('Verification code sent! Please check your email. 📨')
      }

      return result
    } catch (error) {
      loading.stop()
      clearSpinnerLines()
      throw error
    }
  }

  private async verifyCodeWithSpinner(
    code: string,
    email: string,
    baseUrl: string | null
  ): Promise<VerificationResult> {
    const loading = spinner()
    loading.start('Verifying the code...')

    try {
      const result = await this.verifyVerificationCode(code, email, baseUrl)
      loading.stop()
      clearSpinnerLines()

      return result
    } catch (error) {
      loading.stop()
      clearSpinnerLines()
      throw error
    }
  }

  private async getVerificationCode(): Promise<string> {
    const signInCode = await text({
      message: 'Enter the verification code here',
      placeholder: '000000',
      validate: this.validateVerificationCode.bind(this)
    })

    handleSIGINT(signInCode, 'Login cancelled. Goodbye! 👋')
    return signInCode as string
  }

  private async handleLoginResult(
    result: VerificationResult,
    baseUrl: string | null
  ): Promise<void> {
    if (result.success && result.data) {
      await showSuccess('Login successful! 🎉')
      await this.saveProfile(result.data, baseUrl)
      outro(
        `You are now logged in to Keyshade as ${chalk.bold(result.data.name)}`
      )
    } else {
      await showError(result.errorMessage || 'Verification failed')
    }
  }

  private async handleLoginError(error?: string): Promise<void> {
    await showError(error || 'An unexpected error occurred during login')
    note(
      `If you don't have an account, please sign up at ${chalk.blue.underline('https://app.keyshade.io/auth')}`
    )
    process.exit(1)
  }

  // Validation functions

  private validateURL(url: string): string | Error {
    if (url.length === 0) {
      return 'Custom URL cannot be empty'
    }
    if (!z.string().url().safeParse(url).success) {
      return 'Please enter a valid URL'
    }
  }

  private validateEmail(email: string): string | Error {
    if (email.length === 0) {
      return 'Email cannot be empty'
    }
    if (!z.string().email().safeParse(email).success) {
      return 'Please enter a valid email address'
    }
  }

  private readonly validateVerificationCode = (
    value: string
  ): string | undefined => {
    if (value.length === 0) {
      return 'Verification code cannot be empty'
    }
    if (value.length !== 6) {
      return 'Verification code must be 6 characters long'
    }
  }

  // API methods
  private async sendVerificationCode(
    email: string,
    baseUrl?: string | null
  ): Promise<VerificationResult> {
    const cleanBaseUrl = (baseUrl ?? 'https://api.keyshade.io').replace(
      /\/$/,
      ''
    )

    // since before login we won't have the base url, we initialize it here
    // defaulting to the main Keyshade deployment
    // this can be overridden by the user using --base-url option
    // or by setting a default profile with a custom base url
    ControllerInstance.initialize(cleanBaseUrl)

    const { success, error } =
      await ControllerInstance.getInstance().authController.sendOTP({
        email,
        mode: 'cli',
        os: this.getOSInfo(),
        agent: this.getCliVersion()
      })

    const errorMessage = JSON.parse(error?.message || '{}')?.body

    return { success, errorMessage }
  }

  private async verifyVerificationCode(
    signInCode: string,
    email: string,
    baseUrl?: string | null
  ): Promise<VerificationResult> {
    const cleanBaseUrl = (baseUrl ?? 'https://api.keyshade.io').replace(
      /\/$/,
      ''
    )
    /*
    Since before login we won't have the base url, we initialize it here
    defaulting to the main Keyshade deployment this can be overridden by
    the user using --base-url option or by setting a default profile with
    a custom base url
    */
    ControllerInstance.initialize(cleanBaseUrl)

    const { data, success, error } =
      await ControllerInstance.getInstance().authController.validateOTP({
        email,
        otp: signInCode,
        mode: 'cli'
      })

    return {
      data,
      success,
      errorMessage: JSON.parse(error?.message || '{}')?.body
    }
  }

  // Saves the user profile to ~/.keyshade/profile.json after successful login.
  private async saveProfile(
    data: ValidateOTPResponse,
    baseUrl: string | null
  ): Promise<void> {
    const existingProfiles = await fetchProfileConfig()

    existingProfiles[data.id] = {
      user: {
        id: data.id,
        name: data.name,
        email: data.email
      },
      token: data.token,
      sessionId: data.cliSessionId,
      baseUrl: baseUrl ?? 'https://api.keyshade.io',
      metricsEnabled: false
    }

    await writeProfileConfig(existingProfiles)
    await writeDefaultProfileConfig({
      userId: data.id
    })
  }

  private getOSInfo(): string {
    return `${os.type()} ${os.release()} (${os.arch()})`
  }

  private getCliVersion(): string {
    return `CLI ${process.env.CLI_VERSION}`
  }
}
