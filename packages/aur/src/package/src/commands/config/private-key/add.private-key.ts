import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandArgument,
  type CommandOption
} from '@/types/command/command.types'
import {
  fetchPrivateKeyConfig,
  writePrivateKeyConfig
} from '@/util/configuration'

export default class AddPrivateKey extends BaseCommand {
  getName(): string {
    return 'add'
  }

  getDescription(): string {
    return 'Add a private key for a project and workspace combination'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-w',
        long: '--workspace <string>',
        description: 'Workspace slug'
      },
      {
        short: '-p',
        long: '--project <string>',
        description: 'Project slug'
      }
    ]
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Private Key>',
        description: 'Private key to add'
      }
    ]
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    const { workspace, project } = options
    const [privateKey] = args

    if (!workspace || !project) {
      throw new Error('Workspace and project slugs are required.')
    }

    const privateKeys = await fetchPrivateKeyConfig()

    privateKeys[`${workspace}_${project}`] = privateKey

    await writePrivateKeyConfig(privateKeys)
  }
}
