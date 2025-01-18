import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { Logger } from './logger'

export class SentryInstance extends Sentry.Scope {
  private static instance: typeof Sentry | null = null
  private static init(): typeof Sentry | null {
    try {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        environment: 'CLI',
        integrations: [nodeProfilingIntegration()],
        beforeSend(event) {
          if (event.exception) {
            Logger.log(
              'A detailed error report has been sent to the Keyshade team.'
            )
          }
          return event
        }
      })
      return Sentry
    } catch (error) {
      Logger.error('Failed to initialize error reporting.')
      Sentry.captureException(error)
      return null
    }
  }

  static getInstance(): typeof Sentry | null {
    if (!this.instance) {
      this.instance = SentryInstance.init()
    }
    return this.instance
  }

  static captureException(exception: unknown, hint?: Sentry.EventHint): string {
    return SentryInstance.getInstance()?.captureException(exception, hint)
  }
}
