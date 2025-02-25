import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UpdateVariable extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates a variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Variable Slug>',
        description: 'Slug of the variable that you want to update'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the Variable'
      },
      {
        short: '-d',
        long: '--note <string>',
        description: ' An optional note describing the usage of the variable.'
      },
      {
        short: '-e',
        long: '--entry [entries...]',
        description:
          'An array of values for the variable. If specified, should be in the form <environment slug>=<value>'
      }
    ]
  }

  getUsage(): string {
    return `keyshade variable update <variable slug> [options]
    
  Update variable's name and note
  keyshade variable update variable-1 --name "My variable" --note "This is a variable"
  
  Add more entries to a variable
  keyshade variable update apikey-1 --entry "dev=super" "prod=variable"
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [variableSlug] = args

    const { error, success } =
      await ControllerInstance.getInstance().variableController.updateVariable(
        {
          variableSlug,
          ...(await this.parseInput(options))
        },
        this.headers
      )

    if (success) {
      Logger.info('Variable updated successfully!')
    } else {
      this.logError('Failed to update variable', error)
    }
  }

  private async parseInput(options: any): Promise<{
    name?: string
    note?: string
    entries?: Array<{ value: string; environmentSlug: string }>
  }> {
    const { name, note, entry: rawEntries } = options

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
      entries: entries.length !== 0 ? entries : undefined
    }
  }
}
