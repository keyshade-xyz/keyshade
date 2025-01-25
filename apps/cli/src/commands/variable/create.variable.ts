import BaseCommand from '@/commands/base.command'
import { text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'

export default class CreateVariable extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create a variable'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description:
          'Slug of the project under which you want to create variable'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the variable. Must be unique across the project'
      },
      {
        short: '-d',
        long: '--note <string>',
        description: 'A note describing the usage of the variable.'
      },
      {
        short: '-e',
        long: '--entries [entries...]',
        description:
          'An array of key-value pair (value and environmentSlug) for the variable.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const { name, note, entries } = await this.parseInput(options)
    const [projectSlug] = args

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.createVariable(
        {
          name,
          note,
          entries,
          projectSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(
        `Variable ${data.variable.name} (${data.variable.slug}) created successfully!`
      )
      Logger.info(`Created at ${data.variable.createdAt}`)
      Logger.info(`Updated at ${data.variable.updatedAt}`)
    } else {
      Logger.error(`Failed to create variable: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to create variable.\n' + JSON.stringify(error))
      }
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    note?: string
    entries: Array<{ value: string; environmentSlug: string }>
  }> {
    let { name, note } = options
    const { entries } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of variable',
        placeholder: 'My Variable'
      })
    }

    if (!entries) {
      throw new Error('Entries is required')
    }

    if (!note) {
      note = name
    }

    const parsedEntries = entries.map((entry) => {
      const [environmentSlug, value] = entry.split('=').map((s) => s.trim())
      if (!environmentSlug || !value) {
        throw new Error(
          `Invalid entry format: ${entry}. Expected format: "environmentSlug=value"`
        )
      }
      return { environmentSlug, value }
    })

    return {
      name,
      note,
      entries: parsedEntries
    }
  }
}
