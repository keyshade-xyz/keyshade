import { isCancel, outro, stream } from '@clack/prompts'
import chalk from 'chalk'

export function clearSpinnerLines(): void {
  process.stdout.write('\x1b[1A\x1b[2K')
  process.stdout.write('\x1b[1A\x1b[2K')
}

export async function showSuccess(message: string): Promise<void> {
  await stream.success(
    // eslint-disable-next-line prettier/prettier, generator-star-spacing
    (function* () {
      yield chalk.green(message)
    })()
  )
}

export async function showError(message: string): Promise<void> {
  await stream.error(
    // eslint-disable-next-line prettier/prettier, generator-star-spacing
    (function* () {
      yield chalk.red(message)
    })()
  )
}

/** Gracefully Handle SIGINT (Ctrl+C) for Clack Prompts
 * @param clackResponse - The response from a Clack prompt
 * @param message - The message to display on cancellation
 */
export function handleSIGINT(
  clackResponse: symbol | string | boolean,
  message: string
): void {
  if (isCancel(clackResponse)) {
    outro(chalk.red(message))
    process.exit(0)
  }
}
