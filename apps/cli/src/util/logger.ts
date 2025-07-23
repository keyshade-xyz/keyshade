/* eslint-disable @typescript-eslint/no-namespace */
import chalk from 'chalk'
import { SentryInstance } from './sentry'

export namespace Logger {
  export function log(message: string) {
    console.log(`${chalk.blueBright('🔹 LOG')}: ${message}`)
  }

  export function info(message: string) {
    console.info(`${chalk.cyan('ℹ️ INFO')}: ${message}`)
  }

  export function success(message: string) {
    console.log(`${chalk.greenBright('✅ SUCCESS')}: ${message}`)
  }

  export function warn(message: string) {
    console.warn(`${chalk.yellow('⚠️ WARNING')}: ${message}`)
  }

  export function error(message: string) {
    console.error(`${chalk.redBright('❌ ERROR')}: ${message}`)
  }

  export function critical(message: string) {
    console.error(
      `${chalk.bgRed.white.bold('🔥 CRITICAL')}: ${chalk.whiteBright(message)}`
    )
  }

  export function debug(message: string) {
    console.debug(`${chalk.gray('🐛 DEBUG')}: ${message}`)
  }

  export function report(message: string) {
    SentryInstance.captureException(new Error(message))
  }

  export function header(message: string) {
    console.log(`${chalk.white.bold('◽️ ' + message)} `)
  }
  export function subHeader(message: string) {
    console.log(`${chalk.white(message)} `)
  }

  export function text(message: string) {
    console.log(`${chalk.white(' | ' + message)} `)
  }

  export function section(content: string[]) {
    const border = '═'.repeat(50)
    console.log(`\n${border}`)
    content.forEach((line) => {
      console.log(line)
    })
    console.log(`${border}\n`)
  }
}
