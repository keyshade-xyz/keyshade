import { randomBytes } from 'crypto'

export const generateApiKey = (): string =>
  'ks_' + randomBytes(24).toString('hex')
