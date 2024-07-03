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

    if (!this.profiles[profile]) {
      s.stop(`Profile ${profile} not found`)
      return
    }

    const isDefaultProfile = this.profiles.default === profile

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

    await writeProfileConfig(this.profiles)

    s.stop(`Profile ${profile} updated`)
  }
}
