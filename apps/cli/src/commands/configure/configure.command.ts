import { Command } from 'commander'
import BaseCommand from '../base/command.interface'
import { intro, outro, confirm, spinner, isCancel, text } from '@clack/prompts'
import {
  fetchUserRootConfigurationFiles,
  getUserRootConfigurationFilePath,
  writeProjectRootConfig,
  writeUserRootConfig
} from '../../util/configuration'
import { existsSync } from 'fs'
import Logger from 'src/util/logger'

export default class ConfigureCommand implements BaseCommand {
  prepareCommand(program: Command): void {
    program
      .command('configure')
      .description('Configure the CLI')
      .helpCommand('-h, --help', 'Display this help message')
      .option(
        '-f, --force',
        'Force the configuration to be applied (overwrites existing configuration)',
        false
      )
      .option('-w, --workspace <string>', 'Workspace name to configure')
      .option('-p, --project <string>', 'Project name to configure')
      .option('-e, --environment <string>', 'Environment to configure')
      .option('-k, --private-key <string>', 'Private key for the project')
      .option('-a, --api-key <string>', 'API key to access the workspace')
      .option('-b, --base-url <string>', 'Base URL for the keyshade server')
      .option('-l, --list', 'List all configurations in user root')
      .action((str) => {
        this.action(str)
      })
  }

  private async action(parsedData) {
    try {
      const { list } = parsedData

      if (list) {
        await this.listConfigurations()
      } else {
        await this.createConfiguration(parsedData)
      }
    } catch (error) {
      Logger.error(error)
      process.exit(1)
    }
  }

  private async listConfigurations() {
    intro('Configurations present: ')

    const configurations = await fetchUserRootConfigurationFiles()
    console.log(configurations)
  }

  private async createConfiguration(parsedData) {
    const { baseUrl } = parsedData
    let { workspace, project, environment, apiKey, privateKey } = parsedData

    // If a flag isn't set, prompt the user for the value

    intro('Configure the CLI')

    if (!workspace) {
      workspace = await text({
        message: 'Enter the workspace name'
      })
    }

    if (!project) {
      project = await text({
        message: 'Enter the project name'
      })
    }

    if (!environment) {
      environment = await text({
        message: 'Enter the environment name'
      })
    }

    if (!apiKey) {
      apiKey = await text({
        message: 'Enter the API key'
      })
    }

    if (!privateKey) {
      privateKey = await text({
        message: 'Enter the private key'
      })
    }

    const s = spinner()
    s.start('Configuring the CLI')

    const { upsertProjectRootConfig, upsertUserRootConfig } =
      await this.handleExistingConfigurations(parsedData)

    if (upsertUserRootConfig) {
      Logger.info('Writing user root config')
      writeUserRootConfig(project, {
        apiKey,
        privateKey
      })
    }

    if (upsertProjectRootConfig) {
      Logger.info('Writing project root config')
      writeProjectRootConfig({
        workspace,
        project,
        environment,
        baseUrl: baseUrl || undefined
      })
    }

    s.stop()

    outro('Configuration complete!')
  }

  private async handleExistingConfigurations(parsedData: {
    force: boolean
    project: string
  }) {
    const { force, project } = parsedData

    let upsertProjectRootConfig = true
    let upsertUserRootConfig = true

    if (!force) {
      const userRootConfigExists = existsSync(
        getUserRootConfigurationFilePath(project)
      )

      if (userRootConfigExists) {
        const overwrite = await confirm({
          message: 'Overwrite existing user configuration?'
        })

        if (isCancel(overwrite)) {
          upsertUserRootConfig = false
        }
      }

      const projectRootConfigExists = existsSync('keyshade.json')

      if (projectRootConfigExists) {
        const overwrite = await confirm({
          message: 'Overwrite existing project configuration?'
        })

        if (isCancel(overwrite)) {
          upsertProjectRootConfig = false
        }
      }
    }

    return { upsertProjectRootConfig, upsertUserRootConfig }
  }
}
