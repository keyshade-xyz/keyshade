import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import { log, spinner } from '@clack/prompts'
import { PatUtils } from '@/util/pat'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines } from '@/util/prompt'
import formatDate from '@/util/date-formatter'

export default class UpdatePat extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates the details of an existing personal access token'
  }

  getUsage(): string {
    return `keyshade pat update token_id
    
    Select and update a personal access token
    keyshade pat update
    
    Update a personal access token with id mm53k2k32l77
    keyshade pat update --token-id mm53k2k32l77
    
    Update the name of a personal access token with id mm53k2k32l77
    keyshade pat update --token-id mm53k2k32l77 --name "my_token"
    
    Update the expiry of a personal access token with id mm53k2k32l77
    keyshade pat update --token-id mm53k2k32l77 --expires-after-days 30
    `
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-i',
        long: '--token-id <string>',
        description: 'ID of the PAT that you want to update.'
      },
      {
        short: '-n',
        long: '--name <string>',
        description: 'New name for the PAT.'
      },
      {
        short: '-e',
        long: '--expires-after-days <string>',
        description: 'New expiry for the PAT.'
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { tokenId, name, expiresAfterDays } = await this.parseOptions(options)

    const loading = spinner()
    loading.start('Updating your personal access token...')
    try {
      const { data, success, error } =
        await ControllerInstance.getInstance().personalAccessTokenController.updatePersonalAccessToken(
          {
            tokenId,
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
✅ Personal Access Token Updated Successfully!

🔖 Name: ${data.name}
⏳ Expires On: ${data.expiresOn ? formatDate(data.expiresOn) : 'Never'}
`.trim()
        )
      } else if (error) {
        loading.stop()
        clearSpinnerLines()
        log.error(
          `We encountered an error while updating your personal access token: ${JSON.parse(error.message).body}`
        )
      }
    } catch (error) {
      console.error(error)
      clearSpinnerLines()
      loading.stop()
      log.error(
        'We encountered an error while updating your personal access token!'
      )
    }
  }

  private async parseOptions(options: CommandActionData['options']): Promise<{
    tokenId: string
    name: string | undefined
    expiresAfterDays: number | undefined
  }> {
    let { tokenId, name, expiresAfterDays } = options

    if (Object.keys(options).length === 0) {
      // If nothing is provided, assume user wants to use the interactive mode

      tokenId = await PatUtils.selectPatFromMenu(this.headers)
      name = await PatUtils.readName()
      expiresAfterDays = await PatUtils.readExpiresAfterDays()
    } else {
      // Else, user is a god

      if (!tokenId) {
        throw new Error('No token ID provided.')
      }

      if (!name && !expiresAfterDays) {
        log.message('Nothing to update!')
        process.exit(0)
      }
    }

    return {
      tokenId,
      name,
      expiresAfterDays: expiresAfterDays
        ? parseInt(expiresAfterDays)
        : undefined
    }
  }
}
