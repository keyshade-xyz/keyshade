import BaseCommand from '@/commands/base.command'
import { log, spinner } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { clearSpinnerLines } from '@/util/prompt'
import { Table } from '@/util/table'
import dayjs from 'dayjs'

export default class ListPat extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'Lists all personal access tokens of the user'
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action(): Promise<void> {
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

        const headers = [
          '🏷️  Name',
          '⏳  Expires On',
          '🪄  Created On',
          '📊  Last Used'
        ]

        const rows = data.map((pat) => [
          pat.name,
          pat.expiresOn
            ? dayjs(pat.expiresOn).format('hh:mm A, MMMM D, YYYY')
            : '—',
          dayjs(pat.createdAt).format('hh:mm A, MMMM D, YYYY'),
          dayjs(pat.lastUsedOn).format('hh:mm A, MMMM D, YYYY')
        ])

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
