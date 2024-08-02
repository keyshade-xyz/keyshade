import { Command } from 'commander'
import type BaseCommand from '@/commands/base.command'
import ProfileCommand from '@/commands/profile.command'
import InitCommand from '@/commands/init.command'
import RunCommand from '@/commands/run.command'
import EnvironmentCommand from '@/commands/environment.command'

const program = new Command()

program.option('--profile <string>', 'The profile to use')
program.option('--api-key <string>', 'The API key to use')
program.option('--base-url <string>', 'The base URL to use')

const COMMANDS: BaseCommand[] = [
  new RunCommand(),
  new InitCommand(),
  new ProfileCommand(),
  new EnvironmentCommand()
]

COMMANDS.forEach((command) => {
  command.prepare(program)
})

program.parse(process.argv)
