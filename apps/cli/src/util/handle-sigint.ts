import { outro, isCancel } from '@clack/prompts'
import chalk from 'chalk'

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
