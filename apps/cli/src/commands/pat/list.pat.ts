import BaseCommand from '@/commands/base.command'
import { log, spinner } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines } from '@/util/prompt'
import { Table } from '@/util/table'
import formatDate from '@/util/date-formatter'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'

export default class ListPat extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'Lists all personal access tokens of the user'
  }

  getUsage(): string {
    return `keyshade pat list [options]
    
    Lists all personal access tokens of the user
    keyshade pat list
    
    Lists all personal access tokens of the user with detailed information
    keyshade pat list --verbose
    `
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--verbose',
        defaultValue: false,
        description:
          'Prints detailed information about each personal access token'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options }: CommandActionData): Promise<void> {
    const loading = spinner()
    loading.start('Fetching your personal access tokens...')
    try {
      const { data, success, error } =
        await ControllerInstance.getInstance().personalAccessTokenController.getAllPersonalAccessTokens(
          this.headers
        )

      if (success) {
        loading.stop()
        clearSpinnerLines()
        log.success(`Received ${data.length} personal access tokens.`)

        let headers: string[]
        let rows: string[][]

        if (options.verbose) {
          headers = [
            '🏷️  Name',
            '⏳  Expires On',
            '🪄  Created On',
            '📊  Last Used',
            '🧩  ID'
          ]

          rows = data.map((pat) => [
            pat.name,
            pat.expiresOn ? formatDate(pat.expiresOn) : '—',
            formatDate(pat.createdAt),
            formatDate(pat.lastUsedOn),
            pat.id
          ])
        } else {
          headers = ['🏷️  Name', '⏳  Expires On', '🧩  ID']

          rows = data.map((pat) => [
            pat.name,
            pat.expiresOn ? formatDate(pat.expiresOn) : '—',
            pat.id
          ])
        }

        Table.render(headers, rows)
      } else if (error) {
        loading.stop()
        clearSpinnerLines()
        log.error(
          `We encountered an error while fetching your personal access tokens: ${JSON.parse(error.message).body}`
        )
      }
    } catch (error) {
      console.error(error)
      clearSpinnerLines()
      loading.stop()
      log.error(
        'We encountered an error while fetching your personal access tokens!'
      )
    }
  }
}
