import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { fetchProfileConfig } from '../../util/configuration'
import Logger from '../../util/logger'
import { ProfileConfig } from '../../types/index.types'
import { getDefaultProfile } from '../../util/profile'

export default class ListProfile extends BaseCommand {
  private profiles: ProfileConfig

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

    this.profiles = await fetchProfileConfig()
    const defaultProfile = getDefaultProfile(this.profiles)
    delete this.profiles.default

    Logger.log('Profiles:')
    Object.keys(this.profiles).forEach((profile) =>
      this.printProfile(profile, defaultProfile, verbose)
    )
  }

  private printProfile(
    profile: string,
    defaultProfile: string,
    verbose: boolean
  ): void {
    if (defaultProfile === profile) {
      Logger.log(`- ${profile} (default)`)
    } else {
      Logger.log(`- ${profile}`)
    }

    if (verbose) {
      Logger.log(`  - API Key: ${this.profiles[profile].apiKey}`)
      Logger.log(`  - Base URL: ${this.profiles[profile].baseUrl}`)
    }
  }
}
