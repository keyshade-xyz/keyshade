import BaseCommand from './base.command'
import CreateProfile from './profile/create.profile'
import DeleteProfile from './profile/delete.profile'
import ListProfile from './profile/list.profile'
import UpdateProfile from './profile/update.profile'
import UseProfile from './profile/use.profile'

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
