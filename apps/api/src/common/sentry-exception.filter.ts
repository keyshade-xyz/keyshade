// src/filters/sentry-exception.filter.ts
import { Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import * as Sentry from '@sentry/node'
import { constructErrorBody } from './util'

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    try {
      // Only proceed if we're in an HTTP context
      if (request && response) {
        Sentry.withScope((scope) => {
          scope.addEventProcessor((event) => {
            event.request = {
              method: request.method,
              url: request.url,
              headers: request.headers,
              data: request.body
            }
            return event
          })

          Sentry.captureException(exception)
        })

        // Only call super if we have a valid HTTP context
        // super.catch(exception, host)
      } else {
        // For non-HTTP contexts, just report to Sentry
        Sentry.captureException(exception)
      }
    } catch (filterError) {
      // Ensure we don't crash the app if error handling fails
      Sentry.captureException(filterError)
      Sentry.captureException(exception)
    } finally {
      response.status(500).json({
        message: constructErrorBody(
          'Internal Server Error',
          'Something went wrong on our end. If the error persists, please get in touch with us at support@keyshade.xyz'
        )
      })
    }
  }
}
