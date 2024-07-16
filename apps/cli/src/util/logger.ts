/* eslint-disable @typescript-eslint/no-namespace */
import * as chalk from 'chalk'
import * as moment from 'moment'

export namespace Logger {
  export function log(message: string) {
    console.log(
      `${chalk.blue('[LOG]')} ${chalk.blue(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }

  export function info(message: string) {
    console.info(
      `${chalk.green('[INFO]')} ${chalk.green(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }

  export function error(message: string) {
    console.error(
      `${chalk.red('[ERROR]')} ${chalk.red(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }

  export function warn(message: string) {
    console.warn(
      `${chalk.yellow('[WARN]')} ${chalk.yellow(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }
}
