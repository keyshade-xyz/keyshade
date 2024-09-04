import { Injectable, LoggerService } from '@nestjs/common'
import chalk from 'chalk'
import moment from 'moment'

@Injectable()
export class CustomLoggerService implements LoggerService {
  log(message: string) {
    this.info(message)
  }

  info(message: string) {
    console.info(
      `${chalk.green('[INFO]')} ${chalk.green(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }

  error(message: string) {
    console.error(
      `${chalk.red('[ERROR]')} ${chalk.red(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }

  warn(message: string) {
    console.warn(
      `${chalk.yellow('[WARN]')} ${chalk.yellow(
        moment().format('YYYY-MM-DD HH:mm:ss')
      )} - ${message}`
    )
  }
}
