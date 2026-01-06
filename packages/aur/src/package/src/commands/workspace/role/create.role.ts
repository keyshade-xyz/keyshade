import BaseCommand from '@/commands/base.command'
import {
  type CommandOption,
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class CreateRoleCommand extends BaseCommand {
  getName() {
    return 'create'
  }

  getDescription(): string {
    return 'Create workspace role'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace to associate this role.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the workspace role.'
      },
      {
        short: '-d',
        long: '--description <string>',
        description: 'Description of the workspace role.'
      },
      {
        short: '-c',
        long: '--color-code <string>',
        description: 'Color code of the workspace role.'
      },
      {
        short: '-a',
        long: '--authorities <comma separated list>',
        description: 'Authorities of the workspace role.'
      },
      {
        short: '-p',
        long: '--projects <comma separated list>',
        description: 'Project slugs of the workspace role.'
      },
      {
        short: '-e',
        long: '--environments <comma separated list>',
        description:
          'Environment slugs to be associated for projects. Separate list of environments with colon(:) for each project. And comma(,) to separate each project.'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    const {
      name,
      description,
      colorCode,
      authorities,
      projects,
      environments
    } = options

    const authoritiesArray = authorities?.split(',')
    const projectSlugsArray = projects?.split(',')
    const environmentSlugsArray = environments?.split(',')

    if (
      projectSlugsArray &&
      environmentSlugsArray &&
      projectSlugsArray?.length !== environmentSlugsArray?.length
    ) {
      Logger.error('Number of projects and environments should be equal')
      return
    }

    const projectEnvironments: Array<{
      projectSlug: string
      environmentSlugs?: string[]
    }> = []

    const len = projectSlugsArray.length
    for (let i = 0; i < len; i++) {
      projectEnvironments.push({
        projectSlug: projectSlugsArray[i],
        environmentSlugs: environmentSlugsArray?.[i].split(':')
      })
    }

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceRoleController.createWorkspaceRole(
        {
          workspaceSlug,
          name,
          description,
          colorCode,
          authorities: authoritiesArray,
          projectEnvironments:
            projectEnvironments.length > 0 ? projectEnvironments : undefined
        },
        this.headers
      )

    if (success) {
      Logger.info('Workspace role created successfully:')
      Logger.info(`Workspace role: ${data.name} (${data.slug})`)
      Logger.info(`Description: ${data.description || 'N/A'}`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
      Logger.info(`Color code: ${data.colorCode}`)
      Logger.info('Authorities:')
      for (const authority of data.authorities) {
        Logger.info(`- ${authority}`)
      }
      Logger.info('Projects:')
      for (const project of data.projects) {
        Logger.info(`- ${project.project.name} (${project.project.slug})`)
      }
    } else {
      this.logError(error)
    }
  }
}
