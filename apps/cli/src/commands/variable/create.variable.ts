import BaseCommand from '@/commands/base.command'
import { text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'
import { CreateVariableRequestSchema } from '@keyshade/schema/raw'

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
        long: '--entry [entries...]',
        description:
          'An array of values for the variable. If specified, should be in the form <environment slug>:<value>'
      }
    ]
  }

  getUsage(): string {
    return `keyshade variable create <project slug> [options]
    
  Create a variable
  keyshade variable create project-1 --name "PORT" --entry "alpha=8080"
  
  Create a variable with note
  keyshade variable create project-1 --name "PORT" --note "This is a variable"
    `
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

    const payload = {
      projectSlug: projectSlug.trim(),
      name: name.trim(),
      note: note?.trim(),
      entries
    }

    const parsedPayload = CreateVariableRequestSchema.safeParse(payload)

    if (!parsedPayload.success) {
      Logger.error('Invalid input:')
      for (const issue of parsedPayload.error.issues) {
        Logger.error(`- ${issue.path.join('.') || 'input'} : ${issue.message}`)
      }
      return
    }

    const { data, error, success } =
      await ControllerInstance.getInstance().variableController.createVariable(
        parsedPayload.data,
        this.headers
      )

    if (success) {
      Logger.info(`Variable ${data.name} (${data.slug}) created successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
    } else {
      this.logError(error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    note?: string
    entries?: Array<{ value: string; environmentSlug: string }>
  }> {
    let { name, note } = options
    const { entry: rawEntries } = options

    const entries: Array<{ value: string; environmentSlug: string }> = []

    if (!name) {
      name = await text({
        message: 'Enter the name of variable',
        placeholder: 'My Variable'
      })
    }

    if (rawEntries) {
      for (const entry of rawEntries) {
        const idx = entry.indexOf('=')
        if (idx <= 0 || idx === entry.length - 1) {
          throw new Error(
            `Invalid entry format. Expected <environment slug>=<value> but got ${entry}`
          )
        }

        const environmentSlug = entry.slice(0, idx).trim()
        const value = entry.slice(idx + 1).trim()

        entries.push({
          value,
          environmentSlug
        })
      }
    }

    return {
      name,
      note,
      entries: entries.length !== 0 ? entries : undefined
    }
  }
}
