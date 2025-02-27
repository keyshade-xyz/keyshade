/* eslint-disable @typescript-eslint/no-var-requires */
import { createHash, randomBytes } from 'crypto'

/**
 * Encrypts the given data using the given public key.
 *
 * @param publicKey The public key to use for encryption. Must be a hexadecimal string.
 * @param data The data to encrypt.
 *
 * @returns The encrypted data as a JSON string.
 */
export const encrypt = async (
  publicKey: string,
  data: string
): Promise<string> => {
  const eccrypto = require('eccrypto')

  const encrypted = await eccrypto.encrypt(
    Buffer.from(publicKey, 'hex'),
    Buffer.from(data)
  )

  return JSON.stringify(encrypted)
}

/**
 * Decrypts the given data using the given private key.
 *
 * @param privateKey The private key to use for decryption. Must be a hexadecimal string.
 * @param data The data to decrypt.
 *
 * @returns The decrypted data as a string.
 */
export const decrypt = async (
  privateKey: string,
  data: string
): Promise<string> => {
  const eccrypto = require('eccrypto')
  const parsed = JSON.parse(data)

  const eicesData = {
    iv: Buffer.from(parsed.iv),
    ephemPublicKey: Buffer.from(parsed.ephemPublicKey),
    ciphertext: Buffer.from(parsed.ciphertext),
    mac: Buffer.from(parsed.mac)
  }

  const decrypted = await eccrypto.decrypt(
    Buffer.from(privateKey, 'hex'),
    eicesData
  )

  return decrypted.toString()
}

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
