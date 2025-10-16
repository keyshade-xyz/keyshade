import BaseCommand from '@/commands/base.command'

export default class RegeneratePat extends BaseCommand {
  getName(): string {
    return 'regenerate'
  }

  getDescription(): string {
    return 'Regenerates the secret of a personal access token'
  }
}
