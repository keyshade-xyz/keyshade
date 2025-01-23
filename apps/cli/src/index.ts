import 'dotenv/config'
import { Command } from 'commander'
import type BaseCommand from './commands/base.command'
import InitCommand from './commands/init.command'
import RunCommand from './commands/run.command'
import ProfileCommand from './commands/profile.command'
import EnvironmentCommand from './commands/environment.command'
import WorkspaceCommand from '@/commands/workspace.command'
import ScanCommand from '@/commands/scan.command'
import ProjectCommand from './commands/project.command'
import SecretCommand from './commands/secret.command'
import VariableCommand from './commands/variable.command'
import { version } from '../package.json'

const program = new Command()

program.version(version, '-v, --version', 'Output the current version')
program.option('--profile <string>', 'The profile to use')
program.option('--api-key <string>', 'The API key to use')
program.option('--base-url <string>', 'The base URL to use')

const COMMANDS: BaseCommand[] = [
  new RunCommand(),
  new InitCommand(),
  new ProfileCommand(),
  new WorkspaceCommand(),
  new ProjectCommand(),
  new EnvironmentCommand(),
  new SecretCommand(),
  new ScanCommand(),
  new VariableCommand()
]

COMMANDS.forEach((command) => {
  command.prepare(program)
})

program.parse(process.argv)
