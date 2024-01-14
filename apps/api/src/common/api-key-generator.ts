import { randomBytes } from 'crypto'

export const generateApiKey = (): string =>
  'ks_' + randomBytes(48).toString('hex')
