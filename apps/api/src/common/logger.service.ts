import { Injectable, LoggerService } from '@nestjs/common'
import chalk from 'chalk'
import moment from 'moment'
import { Logtail } from '@logtail/node'

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logtailLogger: Logtail | null

  log(message: string) {
    this._log('info', message)
  }

  info(message: string) {
    this._log('info', message)
  }

  error(message: string) {
    this._log('error', message)
  }

  warn(message: string) {
    this._log('warn', message)
  }

  private _log(level: 'info' | 'error' | 'warn', message: string) {
    if (!this.logtailLogger) {
      const token = process.env.LOGTAIL_API_TOKEN
      const endpoint = process.env.LOGTAIL_API_ENDPOINT
      if (token && endpoint) {
        console.info(
          `${chalk.green('[INFO]')} ${chalk.green(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - Logtail token and endpoint found. Initializing...`
        )
        this.logtailLogger = new Logtail(token, {
          throwExceptions: true,
          endpoint
        })
      }
    }

    switch (level) {
      case 'info':
        console.info(
          `${chalk.green('[INFO]')} ${chalk.green(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - ${message}`
        )
        this.logtailLogger && this.logtailLogger.info(message)
        break
      case 'error':
        console.error(
          `${chalk.red('[ERROR]')} ${chalk.red(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - ${message}`
        )
        this.logtailLogger && this.logtailLogger.error(message)
        break
      case 'warn':
        console.warn(
          `${chalk.yellow('[WARN]')} ${chalk.yellow(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - ${message}`
        )
        this.logtailLogger && this.logtailLogger.warn(message)
        break
      default:
        break
    }
  }
}
