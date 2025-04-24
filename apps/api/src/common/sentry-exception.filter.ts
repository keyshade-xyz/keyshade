import {
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import * as Sentry from '@sentry/node'
import { constructErrorBody } from './util'

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    try {
      if (
        exception instanceof InternalServerErrorException ||
        exception.name === 'Error'
      ) {
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

          const { header, body } = JSON.parse(exception.message) as {
            header: string
            body: string
          }

          Sentry.captureException(
            new InternalServerErrorException(`${header}: ${body}`)
          )
        })

        this.logger.error(exception)

        response.status(500).json({
          message: constructErrorBody(
            'Internal Server Error',
            'Something went wrong on our end. If the error persists, please get in touch with us at support@keyshade.xyz'
          ),
          statusCode: 500,
          error: 'InternalServerException'
        })
        return
      }
    } catch (filterError) {
      Sentry.captureException(filterError)
      Sentry.captureException(exception)
    }
    this.logger.error(exception)
    response.status(exception['status'] || 500).json({
      message: exception['message'],
      error: exception['name'],
      statusCode: exception['status'] || 500
    })
  }
}
