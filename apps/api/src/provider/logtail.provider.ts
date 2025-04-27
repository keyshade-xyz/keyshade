import { Logtail } from '@logtail/node'
import { Logger, Provider } from '@nestjs/common'

export const LOGTAIL_CLIENT = 'LogtailClient'

export const LogtailProvider: Provider = {
  provide: LOGTAIL_CLIENT,
  useFactory: async () => {
    const logger = new Logger('LogtailProvider')
    const token = process.env.LOGTAIL_API_TOKEN

    if (!token) {
      logger.warn('Logtail token is not set. Skipping initialization...')
      return null
    } else {
      logger.log('Logtail token is set. Initializing...')
    }

    const logtail = new Logtail(token, {
      throwExceptions: true,
      endpoint: 'https://s1287758.eu-nbg-2.betterstackdata.com'
    })
    console.log('logtail', logtail)
    return logtail
  }
}
