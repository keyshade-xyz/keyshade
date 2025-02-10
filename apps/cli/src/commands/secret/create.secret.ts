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
        long: '--entry [entries...]',
        description:
          'An array of values for the secret. If specified, should be in the form <environment slug>=<value>'
      }
    ]
  }

  getUsage(): string {
    return `keyshade secret create <project slug> [options]
    
  Create a secret
  keyshade secret create project-1 --name "API_KEY" --entry "alpha=ks_k23mg45kl6k76l"
  
  Create a secret with note and rotate settings
  keyshade secret create project-1 --name "API_KEY" --note "This is a secret" --rotate-after "24"
    `
  }

  canMakeHttpRequests(): boolean {
    return true
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
      Logger.info(
        `Secret ${data.secret.name} (${data.secret.slug}) created successfully!`
      )
      Logger.info(`Created at ${data.secret.createdAt}`)
      Logger.info(`Updated at ${data.secret.updatedAt}`)
    } else {
      Logger.error(`Failed to create secret: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to create secret.\n' + JSON.stringify(error))
      }
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    note?: string
    rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
    entries: Array<{ value: string; environmentSlug: string }>
  }> {
    let { name, note, rotateAfter } = options
    const { rawEntries } = options

    const entries: Array<{ value: string; environmentSlug: string }> = []

    if (!name) {
      name = await text({
        message: 'Enter the name of secret',
        placeholder: 'My Secret'
      })
    }

    if (!note) {
      note = name
    }

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
