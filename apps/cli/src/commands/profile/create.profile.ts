import BaseCommand from '../base.command'
import {
  CommandActionData,
  CommandOption
} from '../../types/command/command.types'
import { API_BASE_URL } from '../../util/constants'
import { intro, outro, confirm, spinner, text } from '@clack/prompts'
import {
  fetchProfileConfig,
  writeProfileConfig
} from '../../util/configuration'
import { ProfileConfig } from '../../types/index.types'

export default class CreateProfile extends BaseCommand {
  private profiles: ProfileConfig

  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create a new profile'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the profile'
      },
      {
        short: '-a',
        long: '--api-key <string>',
        description: 'API key for the profile'
      },
      {
        short: '-b',
        long: '--base-url <string>',
        description: 'Base URL for the keyshade server',
        defaultValue: API_BASE_URL
      },
      {
        short: '',
        long: '--set-default',
        description: 'Set the profile as the default profile',
        defaultValue: false
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    intro('Creating a new profile')

    const { name, apiKey, baseUrl, setDefault } = await this.parseInput(options)

    this.profiles = await fetchProfileConfig()
    await this.checkOverwriteExistingProfile(name)

    const s = spinner()
    s.start('Saving changes...')

    this.setProfileConfigData(name, apiKey, baseUrl, setDefault)
    await writeProfileConfig(this.profiles)

    s.stop()
    outro(`Profile ${name} created successfully`)
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name: string
    apiKey: string
    baseUrl: string
    setDefault: boolean
  }> {
    let { name, apiKey } = options
    const { baseUrl, setDefault } = options

    if (!name) {
      name = await text({
        message: 'Enter the name of the profile',
        placeholder: 'work'
      })
    }

    if (!apiKey) {
      apiKey = await text({
        message: 'Enter the private key for the profile',
        placeholder: 'ks_************'
      })
    }

    return { name, apiKey, baseUrl, setDefault }
  }

  private async checkOverwriteExistingProfile(name: string): Promise<boolean> {
    if (!!this.profiles[name]) {
      const overwrite = await confirm({
        message: `Profile ${name} already exists. Do you want to overwrite it?`
      })

      if (!overwrite) {
        outro('Profile creation cancelled')
        return
      }
    }
  }

  private setProfileConfigData(
    name: string,
    apiKey: string,
    baseUrl: string,
    setDefault: boolean
  ): void {
    if (setDefault) {
      this.profiles.default = name
    }

    this.profiles[name] = {
      apiKey,
      baseUrl
    }
  }
}
