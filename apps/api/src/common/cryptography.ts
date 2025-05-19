/* eslint-disable @typescript-eslint/no-var-requires */
import { createHash, randomBytes } from 'crypto'

/**
 * Generates a new key pair.
 *
 * @returns An object containing the public key and the private key, both as hexadecimal strings.
 */
export const createKeyPair = (): {
  publicKey: string
  privateKey: string
} => {
  const eccrypto = require('eccrypto')

  const privateKey = eccrypto.generatePrivate()
  const publicKey = eccrypto.getPublic(privateKey)

  return {
    publicKey: publicKey.toString('hex'),
    privateKey: privateKey.toString('hex')
  }
}

/**
 * Generates a new API key.
 *
 * @returns A new API key as a string in the format 'ks_<24 bytes of random data>'.
 */
export const generateApiKey = (): string =>
  'ks_' + randomBytes(24).toString('hex')

/**
 * Returns the SHA256 hash of the given string as a hexadecimal string.
 */
export const toSHA256 = (value: string): string =>
  createHash('sha256').update(value).digest().toString('hex')
