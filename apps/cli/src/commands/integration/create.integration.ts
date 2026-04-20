import BaseCommand from '../base.command'
import { text } from '@clack/prompts'
import {
  type CommandActionData,
  type CommandOption
} from 'src/types/command/command.types'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export class CreateIntegration extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create an integration'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-p',
        long: '--project <project Slug>',
        description: 'Slug of the project which the integration will listen to.'
      },
      {
        short: '-e',
        long: '--environments <env slugs>',
        description:
          'Comma separated list of environments the integration will listen for.'
      },
      {
        short: '-no',
        long: '--notify-on <LIST>',
        description: 'Array of events that the integration listens to. Optional'
      },
      {
        short: '-m',
        long: '--metadata <JSON OBJECT>',
        description:
          'Metadata specific to the environment. Expects a JSON object. Takes precedence to --metadata-file'
      },
      {
        short: '-mf',
        long: '--metadata-file <path/to/file>',
        description:
          'Same as --metadata, just expects a file that will contain the details in JSON object'
      },
      {
        short: '-t',
        long: '--type <>',
        description: 'The type of notification'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const [projectSlug] = args
    const { type, name, metadata, workspaceSlug, environmentSlugs } =
      await this.parseInput(options)

    Logger.info('Creating Integration...')

    const {
      data: integration,
      error,
      success
    } = await ControllerInstance.getInstance().integrationController.createIntegration(
      {
        type,
        name,
        metadata,
        workspaceSlug,
        environmentSlugs,
        projectSlug
      },
      this.headers
    )

    if (success) {
      Logger.info(
        `Integration created:${integration.name} (${integration.slug})`
      )
    } else {
      this.logError(error)
    }
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    type: 'DISCORD' | 'SLACK' | 'GITHUB' | 'GITLAB' | 'VERCEL' | 'AWS_LAMBDA'
    name: string
    description?: string
    metadata: any
    workspaceSlug: string
    environmentSlugs: string[]
  }> {
    const type = options.type as
      | 'DISCORD'
      | 'SLACK'
      | 'GITHUB'
      | 'GITLAB'
      | 'VERCEL'
      | 'AWS_LAMBDA'
    let metadata = {}
    if (options.metadata && typeof options.metadata === 'string') {
      metadata = JSON.parse(options.metadata)
    } else if (
      options.metadataFile &&
      typeof options.metadataFile === 'string'
    ) {
      // Handle metadata file - you might want to add file reading logic here
      // For now, we'll just log that this option is available
      Logger.info(
        'Metadata file option detected - file reading not yet implemented'
      )
    }
    const workspaceSlug = options.workspaceSlug as string
    const environmentSlugs =
      typeof options.environments === 'string'
        ? options.environments.split(',').map((s: string) => s.trim())
        : []
    if (!type) {
      Logger.error('Integration type is required')
      return
    }
    if (!workspaceSlug) {
      Logger.error('Workspace slug is required')
      return
    }
    if (!environmentSlugs.length) {
      Logger.error('At least one environment slug is required')
      return
    }
    let { name } = options
    const { description } = options
    if (!name) {
      name = await text({
        message: 'Enter the name of the Integration',
        placeholder: 'integration'
      })
    }
    return {
      type,
      name,
      description,
      metadata,
      workspaceSlug,
      environmentSlugs
    }
  }
}
