/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app/app.module'
import { QueryTransformPipe } from './common/query.transform.pipe'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'
import { RedisIoAdapter } from './socket/redis.adapter'
import { CustomLoggerService } from './common/logger.service'
import * as cookieParser from 'cookie-parser'

export const sentryEnv = process.env.SENTRY_ENV || 'production'

async function initializeSentry() {
  const logger = new CustomLoggerService()

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
  const logger = new CustomLoggerService()
  const app = await NestFactory.create(AppModule, {
    logger,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, Authorization, x-keyshade-token',
      preflightContinue: false,
      optionsSuccessStatus: 204
    }
  })
  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

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
      'http://localhost:3000',
      'https://keyshade.xyz',
      'https://dashboard.keyshade.xyz'
    ]
  })
  app.use(cookieParser())
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
