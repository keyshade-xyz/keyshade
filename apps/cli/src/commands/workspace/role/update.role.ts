import BaseCommand from '@/commands/base.command'
import {
  CommandOption,
  type CommandActionData,
  type CommandArgument
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'

export default class UpdateRoleCommand extends BaseCommand {
  getName() {
    return 'update'
  }

  getDescription(): string {
    return 'Update workspace role'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Role Slug>',
        description: 'Slug of the workspace role you want to fetch.'
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
        long: '--color-code <hexcode>',
        description: 'Color code of the workspace role.'
      },
      {
        short: '-a',
        long: '--authorities <comma seperated list>',
        description: 'Authorities of the workspace role.'
      },
      {
        short: '-p',
        long: '--project-slugs <comma seperated list>',
        description: 'Project slugs of the workspace role.'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceRoleSlug] = args
    const { name, description, colorCode, authorities, projectSlugs } = options

    const authoritiesArray = authorities?.split(',')
    const projectSlugsArray = projectSlugs?.split(',')

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceRoleController.updateWorkspaceRole(
        {
          workspaceRoleSlug,
          name,
          description,
          colorCode,
          authorities: authoritiesArray,
          projectSlugs: projectSlugsArray
        },
        this.headers
      )

    if (success) {
      Logger.info(`Workspace role updated successfully:`)
      Logger.info(`Workspace role: ${data.name} (${data.slug})`)
      Logger.info(`Description: ${data.description || 'N/A'}`)
      Logger.info(`Created at ${data.createdAt}`)
      Logger.info(`Updated at ${data.updatedAt}`)
      Logger.info(`Color code: ${data.colorCode}`)
      Logger.info(`Authorities:`)
      for (const authority of data.authorities) {
        Logger.info(`- ${authority}`)
      }
      Logger.info(`Projects:`)
      for (const project of data.projects) {
        Logger.info(`- ${project.project.name} (${project.project.slug})`)
      }
    } else {
      Logger.error(`Failed updating workspace role: ${error.message}`)
    }
  }
}
