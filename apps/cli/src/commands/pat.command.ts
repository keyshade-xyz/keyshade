import BaseCommand from '@/commands/base.command'
import UpdatePat from '@/commands/pat/update.pat'
import CreatePat from '@/commands/pat/create.pat'
import RegeneratePat from '@/commands/pat/regenerate.pat'
import ListPat from '@/commands/pat/list.pat'
import DeletePat from '@/commands/pat/delete.pat'

export default class PatCommand extends BaseCommand {
  getName(): string {
    return 'pat'
  }

  getDescription(): string {
    return 'Allows you to manage your personal access tokens on keyshade'
  }

  getSubCommands(): BaseCommand[] {
    return [
      new CreatePat(),
      new UpdatePat(),
      new RegeneratePat(),
      new ListPat(),
      new DeletePat()
    ]
  }
}
