import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { log, spinner } from '@clack/prompts'
import { clearSpinnerLines } from '@/util/prompt'

export default class CreatePat extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Creates a personal access token'
  }

  getUsage(): string {
    return `keyshade pat create [options]
    
    Create a PAT with name my_token
    keyshade pat create --name "my_token"
    
    Add 1 month as token expiry
    keyshade pat create --name "my_token" --expires-after-days 30
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the PAT'
      },
      {
        short: '-e',
        long: '--expires-after-days <number>',
        description:
          'Number of days after which the PAT will expire. Min - 1, Max - 365. By default, the token never expires.'
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { name, expiresAfterDays } = this.parseOptions(options)

    const loading = spinner()
    loading.start('Creating your personal access token...')
    try {
      const { data, success, error } =
        await ControllerInstance.getInstance().personalAccessTokenController.createPersonalAccessToken(
          {
            name,
            expiresAfterDays
          },
          this.headers
        )

      if (success) {
        loading.stop()
        clearSpinnerLines()
        log.success(
          `
✅  Personal Access Token Created Successfully!

🔖 Name: ${data.name}
🔑 Token: ${data.token}

⚠️  This token will only be shown **once**.  
   Please copy and store it securely — you won’t be able to view it again!
`.trim()
        )
      } else if (error) {
        loading.stop()
        clearSpinnerLines()
        log.error(
          `We encountered an error while creating your personal access token: ${JSON.parse(error.message).body}`
        )
      }
    } catch (error) {
      console.error(error)
      clearSpinnerLines()
      loading.stop()
      log.error(
        'We encountered an error while creating your personal access token!'
      )
    }
  }

  private parseOptions(options: CommandActionData['options']): {
    name: string
    expiresAfterDays?: number
  } {
    const { name, expiresAfterDays } = options

    if (!name) {
      throw new Error('No name provided. Please provide a name for the PAT.')
    }

    return {
      name,
      expiresAfterDays: expiresAfterDays ? parseInt(expiresAfterDays) : null
    }
  }
}
