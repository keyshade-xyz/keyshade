import BaseCommand from '../base.command'

export default class ForkProject extends BaseCommand {
  getName(): string {
    return 'fork'
  }

  getDescription(): string {
    return 'Forks a project'
  }
}
