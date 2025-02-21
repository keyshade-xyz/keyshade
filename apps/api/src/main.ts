/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app/app.module'
import { QueryTransformPipe } from './common/pipes/query.transform.pipe'
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { RedisIoAdapter } from './socket/redis.adapter'
import { CustomLoggerService } from './common/logger.service'
import cookieParser from 'cookie-parser'

export const sentryEnv = process.env.SENTRY_ENV || 'production'

async function initializeSentry() {
  const logger = new CustomLoggerService()

  logger.log('Initializing Sentry...')
  if (!process.env.SENTRY_API_DSN) {
    logger.warn('Missing Sentry DSN. Skipping initialization...')
    return
  }

  const sentryConfig = {
    dsn: process.env.SENTRY_API_DSN,
    enabled: sentryEnv !== 'test' && sentryEnv !== 'e2e',
    environment: sentryEnv,
    tracesSampleRate: process.env.SENTRY_API_TRACES_SAMPLE_RATE,
    profilesSampleRate: process.env.SENTRY_API_PROFILES_SAMPLE_RATE,
    integrations: [nodeProfilingIntegration()],
    debug: false
  }
  try {
    Sentry.init(sentryConfig)

    logger.log('Sentry initialized with the following configuration:')
    logger.log(JSON.stringify(sentryConfig, null, 2))
  } catch (error) {
    logger.error(`Failed to initialize Sentry: ${error.message}`)
    Sentry.captureException(error)
  }
}

async function initializeNestApp() {
  const logger = new CustomLoggerService()

  logger.log('Initializing Nest App...')
  const app = await NestFactory.create(AppModule, {
    logger
  })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  logger.log('Connecting to Redis...')
  const redisIpoAdapter = new RedisIoAdapter(app)
  await redisIpoAdapter.connectToRedis()
  app.useWebSocketAdapter(redisIpoAdapter)

  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    }),
    new QueryTransformPipe()
  )
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3025',
      'https://keyshade.xyz',
      'https://app.keyshade.xyz',
      'https://stage.app.keyshade.xyz'
    ]
  })
  app.use(cookieParser())
  const port = process.env.API_PORT
  const domain = process.env.DOMAIN
  const isHttp = domain.includes('localhost')
  app.use(Sentry.Handlers.errorHandler())
  await app.listen(port)
  logger.log(
    `🚀 Application is running on: ${isHttp ? 'http' : 'https'}://${domain}:${port}/${globalPrefix}`
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
