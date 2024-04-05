/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, LoggerService, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app/app.module'
import * as chalk from 'chalk'
import * as moment from 'moment'
import { QueryTransformPipe } from './common/query.transform.pipe'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'

export const sentryEnv = process.env.SENTRY_ENV || 'production'

class CustomLogger implements LoggerService {
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

async function initializeSentry() {
  const logger = new CustomLogger()

  if (
    !process.env.SENTRY_DSN ||
    !process.env.SENTRY_ORG ||
    !process.env.SENTRY_PROJECT ||
    !process.env.SENTRY_AUTH_TOKEN
  ) {
    logger.warn(
      'Missing one or more Sentry environment variables. Skipping initialization...'
    )
  } else {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: sentryEnv !== 'test' && sentryEnv !== 'e2e',
      environment: sentryEnv,
      tracesSampleRate:
        parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
      profilesSampleRate:
        parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) || 1.0,
      integrations: [new ProfilingIntegration()],
      debug: sentryEnv.startsWith('dev')
    })

    logger.log('Sentry initialized')
  }
}

async function initializeNestApp() {
  const logger = new CustomLogger()
  const app = await NestFactory.create(AppModule, {
    logger
  })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    }),
    new QueryTransformPipe()
  )
  const port = process.env.API_PORT || 4200
  const swaggerConfig = new DocumentBuilder()
    .setTitle('keyshade')
    .setDescription('The keyshade API description')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addSecurity('api_key', {
      type: 'apiKey',
      in: 'header',
      name: 'x-keyshade-token'
    })
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document)
  app.use(Sentry.Handlers.errorHandler())
  await app.listen(port)
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  )
}

async function bootstrap() {
  try {
    await initializeSentry()
    await Sentry.startSpan(
      {
        op: 'applicationBootstrap',
        name: 'Application Bootstrap Process'
      },
      async () => {
        await initializeNestApp()
      }
    )
  } catch (error) {
    Sentry.captureException(error)
    Logger.error(error)
  }
}

bootstrap()
