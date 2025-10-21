import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { PatUtils } from '@/util/pat'
import { confirm, log } from '@clack/prompts'
import { handleSIGINT } from '@/util/prompt'

export default class RegeneratePat extends BaseCommand {
  getName(): string {
    return 'regenerate'
  }

  getDescription(): string {
    return 'Regenerates the secret of a personal access token'
  }

  getUsage(): string {
    return `keyshade pat regenerate token_id
    
    Select and regenerate a personal access token
    keyshade pat regenerate
    
    Regenerate a personal access token with id mm53k2k32l77
    keyshade pat regenerate --token-id mm53k2k32l77
    `
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-i',
        long: '--token-id <string>',
        description: 'ID of the PAT that you want to regenerate.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options }: CommandActionData): Promise<void> {
    let { tokenId } = options

    if (!tokenId) {
      tokenId = await PatUtils.selectPatFromMenu(this.headers)
    }

    const shouldContinue = await confirm({
      message:
        'Do you really want to regenerate this token? Services using this token will stop working.'
    })

    handleSIGINT(shouldContinue, 'Regeneration cancelled!')

    if (!shouldContinue) {
      log.message('Regeneration cancelled!')
      process.exit(0)
    }

    const { data, success, error } =
      await ControllerInstance.getInstance().personalAccessTokenController.regeneratePersonalAccessToken(
        { tokenId },
        this.headers
      )

    if (success) {
      log.success(
        `
✅  Personal Access Token Regenerated Successfully!

🔖 Name: ${data.name}
🔑 Token: ${data.token}


⚠️ This token will only be shown once.  
   Please copy and store it securely — you won’t be able to view it again!
      `.trim()
      )
    } else if (error) {
      log.error(
        `We encountered an error while regenerating the personal access token: ${JSON.parse(error.message).body}`
      )
    }
  }
}
