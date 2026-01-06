import BaseCommand from '@/commands/base.command'
import CreateProfile from '@/commands/profile/create.profile'
import DeleteProfile from '@/commands/profile/delete.profile'
import ListProfile from '@/commands/profile/list.profile'
import UpdateProfile from '@/commands/profile/update.profile'
import UseProfile from '@/commands/profile/use.profile'

export default class ProfileCommand extends BaseCommand {
  getName(): string {
    return 'profile'
  }

  getDescription(): string {
    return 'Manage your CLI profiles'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreateProfile(),
      new UpdateProfile(),
      new ListProfile(),
      new UseProfile(),
      new DeleteProfile()
    ]
  }
}
