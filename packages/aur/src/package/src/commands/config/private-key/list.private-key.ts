import BaseCommand from '@/commands/base.command'
import {
  type CommandActionData,
  type CommandOption
} from '@/types/command/command.types'
import { fetchPrivateKeyConfig } from '@/util/configuration'
import { Logger } from '@/util/logger'

export default class ListPrivateKey extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all private keys in ~/.keyshade/private-keys.json'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-w',
        long: '--workspace <string>',
        description: 'Filter by workspace slug'
      },
      {
        short: '-p',
        long: '--project <string>',
        description: 'Filter by project slug'
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { workspace, project } = options
    const privateKeys = await fetchPrivateKeyConfig()
    const keys = Object.entries(privateKeys)

    const filteredKeys = keys.filter(([key]) => {
      const [keyWorkspace, keyProject] = key.split('_')
      return (
        (!workspace ||
          keyWorkspace.toLowerCase().includes(workspace.toLowerCase())) &&
        (!project || keyProject.toLowerCase().includes(project.toLowerCase()))
      )
    })

    const logKeys = filteredKeys.map(([key, value]) => ({
      workspace: key.split('_')[0],
      project: key.split('_')[1],
      value
    }))

    if (logKeys.length === 0) {
      Logger.info('No private keys found.')
    } else {
      logKeys.forEach(({ workspace, project, value }) => {
        Logger.info(
          `Workspace: ${workspace} | Project: ${project} | Key: ${value}`
        )
      })
    }
  }
}
