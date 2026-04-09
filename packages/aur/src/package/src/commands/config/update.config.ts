import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import {
  fetchProjectRootConfig,
  writeProjectRootConfig
} from '@/util/configuration'
import { type ProjectRootConfig } from '@/types/index.types'
import { Logger } from '@/util/logger'

export default class UpdateConfig extends BaseCommand {
  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Updates your keyshade configuration file'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-w',
        long: '--workspace <string>',
        description: 'New workspace slug'
      },
      {
        short: '-p',
        long: '--project <string>',
        description: 'New project slug'
      },
      {
        short: '-e',
        long: '--environment <string>',
        description: 'New environment slug'
      },
      {
        short: '-q',
        long: '--quit-on-decryption-failure <boolean>',
        description: 'Quit on decryption failure'
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    Logger.info('Updating configuration...')

    // Check if keyshade.json is present
    const projectRootConfig = await fetchProjectRootConfig()

    // Parse input
    const updatedConfig = await this.parseInput(options, projectRootConfig)

    // Update keyshade.json
    await writeProjectRootConfig(updatedConfig)

    Logger.info('Configuration updated successfully! Current configuration:')
    Object.entries(updatedConfig).forEach(([key, value]) => {
      Logger.info(`  | ${key}: ${value}`)
    })
  }

  private async parseInput(
    options: CommandActionData['options'],
    projectRootConfig: ProjectRootConfig
  ): Promise<ProjectRootConfig> {
    return {
      workspace: options.workspace || projectRootConfig.workspace,
      project: options.project || projectRootConfig.project,
      environment: options.environment || projectRootConfig.environment,
      quitOnDecryptionFailure:
        options.quitOnDecryptionFailure ||
        projectRootConfig.quitOnDecryptionFailure
    }
  }
}
