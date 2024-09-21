import { CommandOption } from '@/types/command/command.types'

export const PAGINATION_OPTION: CommandOption[] = [
  {
    short: '-p',
    long: '--page <int>',
    description: 'Index of the page.'
  },
  {
    short: '-l',
    long: '--limit <int>',
    description: 'Total number of items per page.'
  },
  {
    short: '-o',
    long: '--order <string>',
    description:
      'Order to sort by - either ascending (ASC) or descending (DESC).'
  },
  {
    short: '--sort',
    long: '--sort <string>',
    description: 'Field to sort by.'
  },
  {
    short: '-s',
    long: '--search <string>',
    description: 'Search term.'
  }
]
