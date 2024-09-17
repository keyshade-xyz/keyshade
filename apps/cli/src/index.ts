import { Command } from 'commander'
import type BaseCommand from './commands/base.command'
import InitCommand from './commands/init.command'
import RunCommand from './commands/run.command'
import ProfileCommand from './commands/profile.command'
import EnvironmentCommand from './commands/environment.command'
import WorkspaceCommand from '@/commands/workspace.command'
import ScanCommand from '@/commands/scan.command'

const program = new Command()

program.option('--profile <string>', 'The profile to use')
program.option('--api-key <string>', 'The API key to use')
program.option('--base-url <string>', 'The base URL to use')

const COMMANDS: BaseCommand[] = [
  new RunCommand(),
  new InitCommand(),
  new ProfileCommand(),
  new WorkspaceCommand(),
  new EnvironmentCommand(),
  new ScanCommand()
]

COMMANDS.forEach((command) => {
  command.prepare(program)
})

program.parse(process.argv)
