import { Command } from 'commander'
import BaseCommand from './commands/base/command.interface'
import ConfigureCommand from './commands/configure/configure.command'
import RunCommand from './commands/run/run.command'

const program = new Command()

const COMMANDS: BaseCommand[] = [new ConfigureCommand(), new RunCommand()]

program
  .version('1.0.0')
  .description('CLI for keyshade')
  .helpCommand('-h, --help', 'Display this help message')
  .action(() => {
    program.help()
  })

COMMANDS.forEach((command) => command.prepareCommand(program))

program.parse(process.argv)
