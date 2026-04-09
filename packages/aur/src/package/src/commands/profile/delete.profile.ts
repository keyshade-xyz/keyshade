import BaseCommand from '@/commands/base.command'
import { confirm, spinner } from '@clack/prompts'
import { checkIsDefaultProfile, checkProfileExists } from '@/util/profile'
import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import { fetchProfileConfig, writeProfileConfig } from '@/util/configuration'
import type { ProfileConfig } from '@/types/index.types'

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
      }
    }
  }
}
