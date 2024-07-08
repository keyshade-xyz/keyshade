import {
  CommandActionData,
  CommandOption
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { fetchProfileConfig } from '../../util/configuration'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Table = require('cli-table')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const colors = require('colors/safe')

export default class ListProfile extends BaseCommand {
  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all profiles'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--verbose',
        description: 'Prints everything',
        defaultValue: false
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { verbose } = options

    const profiles = await fetchProfileConfig()
    const defaultProfile = profiles.default
    delete profiles.default
    const table = new Table({
      chars: {
        top: '═',
        'top-mid': '╤',
        'top-left': '╔',
        'top-right': '╗',
        bottom: '═',
        'bottom-mid': '╧',
        'bottom-left': '╚',
        'bottom-right': '╝',
        left: '║',
        'left-mid': '╟',
        mid: '─',
        'mid-mid': '┼',
        right: '║',
        'right-mid': '╢',
        middle: '│'
      }
    })

    if (verbose) {
      const profileList = []
      Object.keys(profiles).forEach((profile) => {
        profileList.push([
          `${defaultProfile === profile ? `${profile} ${colors.dim('(default)')}` : profile}`,
          `${profiles[profile].apiKey}`,
          `${profiles[profile].baseUrl}`
        ])
      })
      table.push(
        [
          colors.cyan.bold('Profile'),
          colors.cyan.bold('API Key'),
          colors.cyan.bold('Base URL')
        ],
        ...profileList
      )
    } else {
      const profileList = []
      Object.keys(profiles).forEach((profile) => {
        profileList.push([
          `${defaultProfile === profile ? `${profile} ${colors.dim('(default)')}` : profile}`
        ])
      })
      table.push([colors.cyan.bold('Profile')], ...profileList)
    }

    console.log(table.toString())
  }
}
