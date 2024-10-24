import BaseCommand from '@/commands/base.command'
import { text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'

export default class CreateSecret extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Creates a secret'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project under which you want to create'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the secret. Must be unique across the project'
      },
      {
        short: '-d',
        long: '--note <string>',
        description: 'A note describing the usage of the secret.'
      },
      {
        short: '-r',
        long: '--rotate-after <string>',
        description:
          ' The duration in days after which the value of the secret should be rotated. Accepted values are `24`, `168`, `720`, `8769` and `never`. Defaults to `never`.'
      },
      {
        short: '-e',
        long: '--entries [entries...]',
        description:
          'An array of key-value pair (value and environmentSlug) for the secret.'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const { name, note, rotateAfter, entries } = await this.parseInput(options)
    const [projectSlug] = args

    if (!projectSlug) {
      Logger.error('Project slug is required')
      return
    }

    const { data, error, success } =
      await ControllerInstance.getInstance().secretController.createSecret(
        {
          name,
          note,
          rotateAfter,
          entries,
          projectSlug
        },
        this.headers
      )

    if (success) {
      Logger.info(`Secret ${data.name} (${data.slug}) created successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
    } else {
      Logger.error(`Failed to create secret: ${error.message}`)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    note?: string
    rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
    entries: Array<{ value: string; environmentSlug: string }>
  }> {
    let { name, note, rotateAfter } = options
    const { entries } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of secret',
        placeholder: 'My Secret'
      })
    }

    if (!entries) {
      throw new Error('Entries is required')
    }

    if (!note) {
      note = name
    }

    const parsedEntries = entries.map((entry) => {
      const entryObj: { value: string; environmentSlug: string } = {
        value: '',
        environmentSlug: ''
      }
      entry.split(' ').forEach((pair) => {
        const [key, value] = pair.split('=')
        entryObj[key] = value
      })
      return entryObj
    })

    return {
      name,
      note,
      rotateAfter,
      entries: parsedEntries
    }
  }
}
