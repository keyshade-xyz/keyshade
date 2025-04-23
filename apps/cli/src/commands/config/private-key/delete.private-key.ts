import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import {
  fetchPrivateKeyConfig,
  writePrivateKeyConfig
} from '@/util/configuration'

export default class DeletePrivateKey extends BaseCommand {
  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete a private key for project and workspace combination'
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

  async action({ options }: CommandActionData): Promise<void> {
    const { workspace, project } = options

    if (!workspace || !project) {
      throw new Error('Workspace and project slugs are required.')
    }

    const privateKeys = await fetchPrivateKeyConfig()

    if (!privateKeys[`${workspace}_${project}`]) {
      throw new Error(
        'Private key not found for this project and workspace combo.'
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete privateKeys[`${workspace}_${project}`]

    await writePrivateKeyConfig(privateKeys)
  }
}
