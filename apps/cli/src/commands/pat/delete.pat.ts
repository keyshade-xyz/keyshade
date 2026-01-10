import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { confirm, log, spinner } from '@clack/prompts'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import { PatUtils } from '@/util/pat'

export default class DeletePat extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Deletes a personal access token'
  }

  getUsage(): string {
    return `keyshade pat delete token_id
    
    Select and delete a personal access token
    keyshade pat delete
    
    Delete a personal access token with id mm53k2k32l77
    keyshade pat delete --token-id mm53k2k32l77
    `
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-i',
        long: '--token-id <string>',
        description: 'ID of the PAT that you want to delete.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options }: CommandActionData): Promise<void> {
    let tokenId = options.tokenId

    if (!tokenId) {
      tokenId = await PatUtils.selectPatFromMenu(this.headers)
    }

    const shouldContinue = await confirm({
      message: 'Do you really want to delete this token?'
    })

    handleSIGINT(shouldContinue, 'Deletion cancelled!')

    if (!shouldContinue) {
      log.message('Deletion cancelled!')
      process.exit(0)
    }

    const loading = spinner()
    loading.start('Deleting your personal access token...')
    try {
      const { success, error } =
        await ControllerInstance.getInstance().personalAccessTokenController.deletePersonalAccessToken(
          {
            tokenId
          },
          this.headers
        )

      if (success) {
        loading.stop()
        clearSpinnerLines()
        log.success('✅ Personal Access Token Deleted Successfully!')
      } else if (error) {
        loading.stop()
        clearSpinnerLines()
        log.error(
          `We encountered an error while deleting your personal access token: ${JSON.parse(error.message).body}`
        )
      }
    } catch (error) {
      console.error(error)
      clearSpinnerLines()
      loading.stop()
      log.error(
        'We encountered an error while deleting your personal access token!'
      )
    }
  }
}
