import { Logger, Provider } from '@nestjs/common'
import { Polar } from '@polar-sh/sdk'

export const POLAR_CLIENT = 'PolarClient'

export const PolarProvider: Provider = {
  provide: POLAR_CLIENT,
  useFactory: async () => {
    const logger = new Logger('PolarProvider')

    if (
      !process.env.POLAR_API_KEY ||
      !process.env.POLAR_BASE_URL ||
      !process.env.POLAR_WEBHOOK_SECRET
    ) {
      logger.warn('Polar credentials are not set. Skipping intialization...')
      return null
    } else {
      return new Polar({
        accessToken: process.env.POLAR_API_KEY,
        serverURL: process.env.POLAR_BASE_URL
      })
    }
  }
}
