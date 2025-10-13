import { Injectable, LoggerService } from '@nestjs/common'
import chalk from 'chalk'
import moment from 'moment'
import { Logtail } from '@logtail/node'

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logtailLogger: Logtail | null = null

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

  // Helper to extract caller information (TypeScript file, function, and line/col) from the stack trace.
  // Attempts to map .js to .ts to display the TS filename when possible.
  private getCallerInfo() {
    const err = new Error()
    const stack = err.stack?.split('\n') ?? []

    // Skip frames that are internal or within this logger
    const frame = stack
      .map((l) => l.trim())
      .find(
        (l) =>
          !l.includes('node:internal') &&
          !l.includes('(internal/') &&
          !l.includes('CustomLoggerService.') &&
          !l.includes('logger.service') &&
          // skip the first "Error" line
          !l.startsWith('Error')
      )

    if (!frame) {
      return { file: 'unknown.ts', func: 'anonymous', line: 0, col: 0 }
    }

    // Examples of frame formats:
    // at FunctionName (path/to/file.ts:10:15)
    // at path/to/file.ts:10:15
    // at Object.method [as x] (path/to/file.js:10:15)
    const funcMatch =
      frame.match(/at\s+(.*?)\s+\((.*)\)/) || frame.match(/at\s+(.*):\d+:\d+/)
    let func = 'anonymous'
    let location = ''

    if (funcMatch) {
      if (funcMatch.length === 3) {
        func = funcMatch[1] || 'anonymous'
        location = funcMatch[2] || ''
      } else if (funcMatch.length === 2) {
        // No explicit function name, only location captured
        location = funcMatch[1] || ''
      }
    }

    // Extract file, line, col
    const locMatch = location.match(/(.*):(\d+):(\d+)/)
    let file = 'unknown.ts'
    let line = 0
    let col = 0
    if (locMatch) {
      file = locMatch[1]
      line = Number(locMatch[2])
      col = Number(locMatch[3])
    }

    // Prefer showing .ts file; if we see .js, attempt a simple .js -> .ts swap
    if (file.endsWith('.js')) {
      file = file.replace(/\.js$/, '.ts')
    }

    // Only keep the tail of the path to keep logs concise
    const shortFile = file.split(/[\\/]/).slice(-2).join('/')

    return { file: shortFile || 'unknown.ts', func, line, col }
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

    const { file, func, line } = this.getCallerInfo()
    const tsContext = `${file}::${func}:L${line}`

    switch (level) {
      case 'info':
        console.info(
          `${chalk.green('[INFO]')} ${chalk.green(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - ${message} ${chalk.gray(`[${tsContext}]`)}`
        )
        this.logtailLogger &&
          this.logtailLogger.info(`${message} [${tsContext}]`)
        break
      case 'error':
        console.error(
          `${chalk.red('[ERROR]')} ${chalk.red(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - ${message} ${chalk.gray(`[${tsContext}]`)}`
        )
        this.logtailLogger &&
          this.logtailLogger.error(`${message} [${tsContext}]`)
        break
      case 'warn':
        console.warn(
          `${chalk.yellow('[WARN]')} ${chalk.yellow(
            moment().format('YYYY-MM-DD HH:mm:ss')
          )} - ${message} ${chalk.gray(`[${tsContext}]`)}`
        )
        this.logtailLogger &&
          this.logtailLogger.warn(`${message} [${tsContext}]`)
        break
      default:
        break
    }
  }
}
