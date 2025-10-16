import BaseCommand from '@/commands/base.command'
import ControllerInstance from '@/util/controller-instance'
import { log, select, spinner } from '@clack/prompts'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'

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
    keyshade pat delete mm53k2k32l77
    `
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-i',
        long: '--token-id',
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
      tokenId = await this.patSelectionMenu()
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
        log.success('Personal Access Token Deleted Successfully!')
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

  private async patSelectionMenu(): Promise<string> {
    const loading = spinner()
    loading.start('Fetching your personal access tokens...')

    // Fetch all the PATs
    const { data, success, error } =
      await ControllerInstance.getInstance().personalAccessTokenController.getAllPersonalAccessTokens(
        this.headers
      )

    loading.stop()
    clearSpinnerLines()

    if (success) {
      if (data.length === 0) {
        log.message("You don't have any personal access tokens!")
        process.exit(1)
      }

      const pat = await select({
        message: 'Select the personal access token you want to delete',
        options: data.map((p) => ({
          value: p.id,
          label: p.name
        }))
      })

      handleSIGINT(pat, 'Deletion cancelled!')

      return pat as string
    } else if (error) {
      loading.stop()
      clearSpinnerLines()
      log.error(
        `We encountered an error while fetching your personal access tokens: ${JSON.parse(error.message).body}`
      )
    }
  }
}
