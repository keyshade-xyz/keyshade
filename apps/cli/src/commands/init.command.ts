import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from './base.command'
import { intro, text, confirm, outro } from '@clack/prompts'
import { existsSync } from 'fs'
import {
  writePrivateKeyConfig,
  writeProjectRootConfig
} from '@/util/configuration'

export default class InitCommand extends BaseCommand {
  getOptions(): CommandOption[] {
    return [
      {
        short: '-w',
        long: '--workspace <string>',
        description: 'Workspace name to configure'
      },
      {
        short: '-p',
        long: '--project <string>',
        description: 'Project name to configure'
      },
      {
        short: '-e',
        long: '--environment <string>',
        description: 'Environment to configure'
      },
      {
        short: '-k',
        long: '--private-key <string>',
        description: 'Private key for the project'
      },
      {
        short: '-o',
        long: '--overwrite',
        description: 'Overwrite existing configuration',
        defaultValue: false
      },
      {
        short: '-q',
        long: '--quit-on-decryption-failure',
        description: 'Quit on decryption failure',
        defaultValue: false
      }
    ]
  }

  getName(): string {
    return 'init'
  }

  getDescription(): string {
    return 'Initialize the configurations to enable live-updates in the current project'
  }

  async action({ options }: CommandActionData): Promise<void> {
    let { workspace, project, environment, privateKey } = options
    const { overwrite, quitOnDecryptionFailure } = options

    intro('Configure the project for live-updates')

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

    if (!privateKey) {
      privateKey = await text({
        message: 'Enter the private key'
      })
    }

    if (!overwrite) await this.checkOverwriteExistingProjectConfig()

    await writeProjectRootConfig({
      workspace,
      project,
      environment,
      quitOnDecryptionFailure
    })

    await writePrivateKeyConfig({
      [`${workspace}_${project}_${environment}`]: privateKey
    })

    outro('Project configured successfully')
  }

  private async checkOverwriteExistingProjectConfig(): Promise<void> {
    if (existsSync('./keyshade.json')) {
      const overwrite = await confirm({
        message: 'Configuration already exists. Do you want to overwrite it?'
      })

      if (!overwrite) {
        outro('Configuration cancelled')
      }
    }
  }
}
