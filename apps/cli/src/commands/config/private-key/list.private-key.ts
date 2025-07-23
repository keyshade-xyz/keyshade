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
        short: '-p',
        long: '--project <string>',
        description: 'Filter by project slug'
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { project } = options
    const privateKeys = await fetchPrivateKeyConfig()
    const keys = Object.entries(privateKeys)

    const filteredKeys = keys.filter(([key]) => {
      return !project || key.toLowerCase().includes(project.toLowerCase())
    })

    const logKeys = filteredKeys.map(([key, value]) => ({
      project: key,
      value
    }))

    if (logKeys.length === 0) {
      Logger.info('No private keys found.')
    } else {
      logKeys.forEach(({ project, value }) => {
        Logger.info(`Project: ${project} | Key: ${value}`)
      })
    }
  }
}
