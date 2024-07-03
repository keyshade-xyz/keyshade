import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { fetchProfileConfig } from '../../util/configuration'
import Logger from '../../util/logger'

export default class ListProfile extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all profiles'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--verbose',
        description: 'Prints everything',
        defaultValue: false
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { verbose } = options

    const profiles = await fetchProfileConfig()
    const defaultProfile = profiles.default
    delete profiles.default

    Logger.log('Profiles:')
    Object.keys(profiles).forEach((profile) => {
      if (defaultProfile === profile) {
        Logger.log(`- ${profile} (default)`)
      } else {
        Logger.log(`- ${profile}`)
      }

      if (verbose) {
        Logger.log(`  - API Key: ${profiles[profile].apiKey}`)
        Logger.log(`  - Base URL: ${profiles[profile].baseUrl}`)
      }
    })
  }
}
