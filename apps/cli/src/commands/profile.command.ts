import BaseCommand from '@/commands/base.command'
import ListProfile from '@/commands/profile/list.profile'
import UpdateProfile from '@/commands/profile/update.profile'
import SwitchProfile from '@/commands/profile/switch.profile'
import RemoveProfile from '@/commands/profile/remove.profile'

export default class ProfileCommand extends BaseCommand {
  getName(): string {
    return 'profile'
  }

  getDescription(): string {
    return 'Manage your CLI profiles'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new ListProfile(),
      new SwitchProfile(),
      new UpdateProfile(),
      new RemoveProfile()
    ]
  }
}
