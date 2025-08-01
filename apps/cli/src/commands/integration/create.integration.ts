import BaseCommand from '../base.command'
import type { CommandOption } from '@/types/command/command.types'

export class CreateIntegration extends BaseCommand {
  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create an integration'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-p',
        long: '--project <project Slug>',
        description: 'Slug of the project which the integration will listen to.'
      },
      {
        short: '-e',
        long: '--environments <env slugs>',
        description:
          'Comma separated list of environments the integration will listen for.'
      },
      {
        short: '-n',
        long: '--notify-on <LIST>',
        description: 'Array of events that the integration listens to. Optional'
      },
      {
        short: '-m',
        long: '--metadata <JSON OBJECT>',
        description:
          'Metadata specific to the environment. Expects a JSON object. Takes precedence to --metadata-file'
      },
      {
        short: '-mf',
        long: '--metadata-file <path/to/file>',
        description:
          'Same as --metadata, just expects a file that will contain the details in JSON object'
      },
      {
        short: '-t',
        long: '--type <>',
        description: 'The type of notification'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }
}
