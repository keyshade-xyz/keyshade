/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { LoggerService, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app/app.module'
import chalk from 'chalk'
import moment from 'moment'
import { QueryTransformPipe } from './common/query.transform.pipe'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

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

async function bootstrap() {
  const logger = new CustomLogger()
  const app = await NestFactory.create(AppModule, {
    logger
  })
  const globalPrefix = 'api'
  app.setGlobalPrefix(globalPrefix)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    }),
    new QueryTransformPipe()
  )
  const port = 4200
  const swaggerConfig = new DocumentBuilder()
    .setTitle('keyshade')
    .setDescription('The keyshade API description')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document)
  await app.listen(port)
  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  )
}

bootstrap()
