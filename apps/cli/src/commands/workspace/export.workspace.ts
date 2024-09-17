import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'
import { Logger } from '@/util/logger'
import ControllerInstance from '@/util/controller-instance'
import { writeFileSync } from 'fs'

export default class ExportWorkspace extends BaseCommand {
  getName(): string {
    return 'export'
  }

  getDescription(): string {
    return 'Exports all projects, environments, secrets, variables and roles of a workspace'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Workspace Slug>',
        description: 'Slug of the workspace which you want to export.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-s',
        long: '--save-to-file <file>',
        description: 'Saves the exported data to a file.'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [workspaceSlug] = args
    const { saveToFile } = options as { saveToFile: string }

    Logger.info('Exporting workspace...')

    const { data, error, success } =
      await ControllerInstance.getInstance().workspaceController.exportWorkspaceData(
        {
          workspaceSlug
        },
        this.headers
      )

    if (success) {
      if (saveToFile) {
        const filePath = saveToFile
        const fileContent = JSON.stringify(data, null, 2)

        writeFileSync(saveToFile, fileContent)

        Logger.info(`Workspace exported to file: ${filePath}`)
      } else {
        Logger.info(JSON.stringify(data))
      }
    } else {
      Logger.error(`Failed exporting workspace: ${error.message}`)
    }
  }
}
