import BaseCommand from '@/commands/base.command'
import { confirm, note, spinner } from '@clack/prompts'
import {
  clearSpinnerLines,
  handleSIGINT,
  showError,
  showSuccess
} from '@/util/prompt'
import ControllerInstance from '@/util/controller-instance'
import {
  fetchDefaultProfileConfig,
  fetchProfileConfig
} from '@/util/configuration'

export default class RemoveProfile extends BaseCommand {
  getName(): string {
    return 'remove'
  }

  getDescription(): string {
    return 'Removes the currently selected CLI profile and the associated session.'
  }

  async action(): Promise<void> {
    const { userId } = await fetchDefaultProfileConfig()
    const profiles = await fetchProfileConfig()

    if (!profiles[userId]) {
      throw new Error(
        'Looks like your default profile is misconfigured! Please run keyshade login'
      )
    }

    const { sessionId, user } = profiles[userId]

    const shouldContinueRemove = await confirm({
      message: `Are you sure you want to remove profile ${user.name} (${user.email})?`
    })
    handleSIGINT(shouldContinueRemove, 'Profile removal cancelled!')

    if (shouldContinueRemove) {
      const loading = spinner()
      loading.start('Removing profile...')

      try {
        const { success, error } =
          await ControllerInstance.getInstance().cliSessionController.revokeCliSession(
            {
              sessionId
            },
            this.headers
          )
        loading.stop()
        clearSpinnerLines()

        if (success) {
          await showSuccess('Profile removed successfully!')
        } else if (error) {
          await showError(JSON.parse(error?.message || '{}')?.body)
        }
      } catch (error) {
        loading.stop()
        clearSpinnerLines()
        throw error
      }
    } else {
      note('Profile removal cancelled!')
    }
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
