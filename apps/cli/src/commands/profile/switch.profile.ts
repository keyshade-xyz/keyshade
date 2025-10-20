import BaseCommand from '@/commands/base.command'
import {
  fetchDefaultProfileConfig,
  fetchProfileConfig,
  writeDefaultProfileConfig
} from '@/util/configuration'
import { select } from '@clack/prompts'
import { handleSIGINT, showSuccess } from '@/util/prompt'

export default class SwitchProfile extends BaseCommand {
  getName(): string {
    return 'switch'
  }

  getDescription(): string {
    return 'Switch to a different profile'
  }

  async action(): Promise<void> {
    const profiles = await fetchProfileConfig()
    const defaultProfile = await fetchDefaultProfileConfig()

    const options = Object.values(profiles).map((profile) => ({
      value: profile.user.id,
      label: `${profile.user.name} (${profile.user.email}) [${profile.baseUrl}]`,
      hint:
        profile.user.id === defaultProfile.userId
          ? 'Currently selected'
          : undefined,
      disabled: profile.user.id === defaultProfile.userId
    }))

    const selection = await select({
      message: 'Select a profile to use',
      options
    })

    handleSIGINT(selection, 'Profile selection cancelled!')

    await writeDefaultProfileConfig({
      userId: selection as string
    })

    await showSuccess('Profile switched successfully!')
  }

  canMakeHttpRequests(): boolean {
    return false
  }
}
