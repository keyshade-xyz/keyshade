import {
  CommandActionData,
  CommandArgument
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { confirm, spinner } from '@clack/prompts'
import {
  fetchProfileConfig,
  writeProfileConfig
} from '../../util/configuration'
import { ProfileConfig } from 'src/types/index.types'
import { checkIsDefaultProfile, checkProfileExists } from 'src/util/profile'

export default class DeleteProfile extends BaseCommand {
  profiles: ProfileConfig

  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete a profile'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<profile>', description: 'Profile to delete' }]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const profile = args[0]

    const s = spinner()
    s.start('Deleting the profile')

    this.profiles = await fetchProfileConfig()
    checkProfileExists(this.profiles, profile, s)
    await this.makeConfirmation(profile, s)

    this.profiles[profile] = undefined
    if (checkIsDefaultProfile(this.profiles, profile)) {
      delete this.profiles.default
    }
    await writeProfileConfig(this.profiles)

    s.stop(`Profile ${profile} deleted`)
  }

  private async makeConfirmation(profile: string, s: any) {
    if (checkIsDefaultProfile(this.profiles, profile)) {
      const choice = await confirm({
        message: 'Are you sure you want to delete the default profile?'
      })

      if (!choice) {
        s.stop(`Profile ${profile} not deleted`)
        return
      }
    }
  }
}
