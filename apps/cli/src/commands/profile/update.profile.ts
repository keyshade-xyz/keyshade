import {
  CommandActionData,
  CommandArgument,
  CommandOption
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { ProfileConfig } from '../../types/index.types'
import {
  fetchProfileConfig,
  writeProfileConfig
} from '../../util/configuration'
import { spinner } from '@clack/prompts'
import { checkProfileExists, checkIsDefaultProfile } from '../../util/profile'

export default class UpdateProfile extends BaseCommand {
  private profiles: ProfileConfig

  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Update a profile'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<profile>', description: 'Name of the profile to update' }]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'New name of the profile'
      },
      {
        short: '-a',
        long: '--api-key <string>',
        description: 'New private key for the profile'
      },
      {
        short: '-b',
        long: '--base-url <string>',
        description: 'New base URL for the keyshade server'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    this.profiles = await fetchProfileConfig()

    const profile = args[0]
    const { name, apiKey, baseUrl } = options

    const s = spinner()
    s.start('Updating the profile')

    checkProfileExists(this.profiles, profile, s)
    this.updateProfileData(profile, name, apiKey, baseUrl)
    await writeProfileConfig(this.profiles)

    s.stop(`Profile ${profile} updated`)
  }

  private updateProfileData(
    profile: string,
    name: string,
    apiKey: string,
    baseUrl: string
  ): void {
    const isDefaultProfile = checkIsDefaultProfile(this.profiles, profile)

    if (apiKey) {
      this.profiles[profile].apiKey = apiKey
    }

    if (baseUrl) {
      this.profiles[profile].baseUrl = baseUrl
    }

    if (name) {
      this.profiles[name] = this.profiles[profile]
      delete this.profiles[profile]
      if (isDefaultProfile) {
        this.profiles.default = name
      }
    }
  }
}
