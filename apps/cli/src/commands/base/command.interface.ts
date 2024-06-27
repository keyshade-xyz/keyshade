import { Command } from 'commander'

export default interface BaseCommand {
  prepareCommand(program: Command): void
}
