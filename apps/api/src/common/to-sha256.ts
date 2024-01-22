import { createHash } from 'crypto'

export const toSHA256 = (value: string): string =>
  createHash('sha256').update(value).digest().toString('hex')
