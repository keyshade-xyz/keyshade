import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UpdateSecret extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Secret Slug>',
        description: 'Slug of the secret that you want to update'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the secret'
      },
      {
        short: '-d',
        long: '--note <string>',
        description: ' An optional note describing the usage of the secret.'
      },
      {
        short: '-r',
        long: '--rotate-after',
        description:
          'The duration in days after which the value of the secret should be rotated. Accepted values are `24`, `168`, `720`, `8769` and `never`. Defaults to `never`.',
        defaultValue: 'never'
      },
      {
        short: '-e',
        long: '--entry [entries...]',
        description:
          'An array of values for the secret. If specified, should be in the form <environment slug>=<value>'
      }
    ]
  }

  getUsage(): string {
    return `keyshade secret update <secret slug> [options]
    
  Update secret's name and note
  keyshade secret update secret-1 --name "My Secret" --note "This is a secret"
  
  Update the rotation time of a secret
  keyshade secret update secret-1 --rotate-after "24"
  
  Add more entries to a secret
  keyshade secret update apikey-1 --entry "dev=super" "prod=secret"
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [secretSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().secretController.updateSecret(
        {
          secretSlug,
          ...(await this.parseInput(options))
        },
        this.headers
      )

    if (success) {
      Logger.info('Secret updated successfully')
    } else {
      this.logError(error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name?: string
    note?: string
    rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
    entries?: Array<{ value: string; environmentSlug: string }>
  }> {
    const { name, note, rotateAfter, entry: rawEntries } = options

    const entries: Array<{ value: string; environmentSlug: string }> = []

    if (rawEntries) {
      for (const entry of rawEntries) {
        // Check for entry format
        if (!entry.match(/^[a-zA-Z0-9\-_+:[a-zA-Z0-9_\-!@#$%^&*()_+=[ ]+$/)) {
          Logger.warn(
            `Invalid entry format. Expected <environment slug>:<value> but got ${entry}`
          )
        } else {
          const [environmentSlug, value] = entry
            .split('=')
            .map((s: string) => s.trim())

          if (!environmentSlug || !value) {
            Logger.warn(
              `Invalid entry format. Expected <environment slug>:<value> but got ${entry}`
            )
          }

          entries.push({
            value,
            environmentSlug
          })
        }
      }
    }

    return {
      name,
      note,
      rotateAfter,
      entries: entries.length !== 0 ? entries : undefined
    }
  }
}
