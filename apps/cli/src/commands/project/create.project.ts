import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'

export default class CreateProject extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Creates a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description:
          'Slug of the workspace under which you want to create the project'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the project'
      },
      {
        short: '-d',
        long: '--description <string>',
        description: 'Description of the project. Defaults to project name'
      },
      {
        short: '-k',
        long: '--store-private-key',
        description: 'Store the private key in the project.'
      },
      {
        short: '-a',
        long: '--access-level <string>',
        description: 'Access level of the project. Defaults to PRIVATE.',
        defaultValue: 'PRIVATE',
        choices: ['GLOBAL', 'PRIVATE', 'INTERNAL']
      },
      {
        short: '-e',
        long: '--environment <string...>',
        description: `Should be in the format <name(mandatory)>[:<description>(optional)]

Examples:
 $ keyshade [...]
 -> { name: "Default", description: ". . ." }

 $ keyshade [...] -e "dev"
 -> { name: "dev", description: NULL }

 $ keyshade [...] -e "dev:sample env"
 -> { name: "dev", description: "sample env" }

 $ keyshade [...] -e " dev : surrounding blank spaces  "
 -> { name: "dev", description: "surrounding blank spaces" }
`
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args

    const parsedData = await this.parseOptions(options)

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.createProject(
        {
          workspaceSlug,
          ...parsedData
        },
        this.headers
      )

    if (success) {
      Logger.info(`Project ${data.name} (${data.slug}) created successfully!`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
      Logger.info(`Public key: ${data.publicKey}`)
      Logger.info(`Private key: ${data.privateKey}`)
      Logger.info(`Access level: ${data.accessLevel}`)
    } else {
      Logger.error(`Failed to create project: ${error.message}`)
      if (this.metricsEnabled && error?.statusCode === 500) {
        Logger.report('Failed to create project.\n' + JSON.stringify(error))
      }
    }
  }

  async parseOptions(options: CommandActionData['options']): Promise<{
    name: string
    description?: string
    storePrivateKey: boolean
    accessLevel: 'PRIVATE' | 'GLOBAL' | 'INTERNAL'
    environments: Array<{ name: string; description?: string }> | undefined
  }> {
    let { name, description } = options
    const { storePrivateKey, accessLevel, environment } = options

    let environments: Array<{ name: string; description?: string }> | undefined

    if (!name) {
      name = await text({
        message: 'Enter the name of the Project',
        placeholder: 'My Project'
      })
    }

    if (!description) {
      description = name
    }

    if (environment) {
      environments = environment.map((env: string) => {
        const split = env.split(':')
        return {
          name: split[0].trim(),
          description: split[1]?.trim() ?? null
        }
      })
    }

    return { name, description, storePrivateKey, accessLevel, environments }
  }
}
