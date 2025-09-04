/* eslint-disable @typescript-eslint/no-var-requires */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from 'crypto'
import * as eccrypto from 'eccrypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

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

/**
 * Derives a cryptographic key from the given string using SHA256 hashing.
 *
 * @param keyString - The string from which to derive the key.
 * @returns A Buffer containing the derived key.
 */
const deriveKey = (keyString: string): Buffer =>
  createHash('sha256').update(keyString).digest()

/**
 * Encrypts the given string using the given string key.
 *
 * @param text - The string to encrypt.
 * @param secret - Optionally, The string secret to use for encryption.
 * @returns The encrypted string as a base64-encoded string.
 */
export const sEncrypt = (text: string, secret?: string): string => {
  const key = deriveKey(secret || process.env.SERVER_SECRET)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

/**
 * Decrypts the given encrypted string using the given string key.
 *
 * @param encryptedBase64 - The encrypted string as a base64-encoded string.
 * @param secret - Optionally, The string secret to use for decryption.
 *
 * @returns The decrypted string.
 *
 * @throws {Error} If the decryption fails.
 */
export const sDecrypt = (encryptedBase64: string, secret?: string): string => {
  const key = deriveKey(secret || process.env.SERVER_SECRET)
  const data: Buffer = Buffer.from(encryptedBase64, 'base64')

  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + 16)
  const encrypted = data.subarray(IV_LENGTH + 16)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}

/**
 * Encrypts the content of a File object using a password.
 * Reads the file as text, encrypts the content into a base64 string,
 * and returns a new File object with the encrypted content.
 *
 * @param file - The original File object to encrypt.
 * @param secret - The password to use for encryption. If not provided, the default server secret is used.
 * @returns A Promise that resolves to a new File object containing the encrypted data.
 *          The new file will have a 'text/plain' MIME type.
 */
export const encryptFile = async (
  file: File,
  secret?: string
): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64Content = buffer.toString('base64')

  const dataToEncrypt = {
    type: file.type,
    content: base64Content
  }

  const encryptedData = sEncrypt(JSON.stringify(dataToEncrypt), secret)

  return new File([encryptedData], file.name, {
    type: 'text/plain', // The encrypted file is always text
    lastModified: file.lastModified
  })
}

/**
 * Decrypts the content of a File object that was previously encrypted with `encryptFile`.
 * Reads the encrypted base64 string from the file, decrypts it using the password,
 * and returns a new File object with the original, decrypted content.
 *
 * @param encryptedFile - The File object containing the encrypted base64 data.
 * @param secret - The password that was used for encryption.
 * @returns A Promise that resolves to a new File object with the decrypted content.
 *          The file's original name and last modified date are preserved.
 */
export const decryptFile = async (
  encryptedFile: File,
  secret?: string
): Promise<File> => {
  const encryptedContent = await encryptedFile.text()
  const decryptedJson = sDecrypt(encryptedContent, secret)

  const { type, content: base64Content } = JSON.parse(decryptedJson)

  const buffer = Buffer.from(base64Content, 'base64')

  return new File([buffer], encryptedFile.name, {
    type: type, // Restore the original MIME type
    lastModified: encryptedFile.lastModified
  })
}

/**
 * Interface for the encrypted data structure
 */
export interface EncryptedData {
  iv: Buffer
  ephemPublicKey: Buffer
  ciphertext: Buffer
  mac: Buffer
}

/**
 * Encrypts the given data using the given public key.
 *
 * @param publicKey - The public key to use for encryption. Must be a hexadecimal string.
 * @param data - The data to encrypt.
 * @returns The encrypted data as a JSON string.
 * @throws {Error} If the public key is invalid or encryption fails.
 */
export const encrypt = async (
  publicKey: string,
  data: string
): Promise<string> => {
  try {
    // Validate inputs
    if (!publicKey || typeof publicKey !== 'string') {
      throw new Error('Invalid public key: must be a non-empty string')
    }
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid data: must be a non-empty string')
    }

    // Convert public key to Buffer
    const publicKeyBuffer = Buffer.from(publicKey, 'hex')

    // Encrypt the data
    const encrypted = await eccrypto.encrypt(publicKeyBuffer, Buffer.from(data))

    return JSON.stringify(encrypted)
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Decrypts the given data using the given private key.
 *
 * @param privateKey - The private key to use for decryption. Must be a hexadecimal string.
 * @param data - The data to decrypt (JSON string of encrypted data).
 * @returns The decrypted data as a string.
 * @throws {Error} If the private key is invalid, data is malformed, or decryption fails.
 */
export const decrypt = async (
  privateKey: string,
  data: string
): Promise<string> => {
  try {
    // Validate inputs
    if (!privateKey || typeof privateKey !== 'string') {
      throw new Error('Invalid private key: must be a non-empty string')
    }
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid data: must be a non-empty string')
    }

    // Parse the encrypted data
    let parsed: EncryptedData
    try {
      parsed = JSON.parse(data)
    } catch (error) {
      throw new Error('Invalid encrypted data format')
    }

    // Validate parsed data structure
    if (
      !parsed.iv ||
      !parsed.ephemPublicKey ||
      !parsed.ciphertext ||
      !parsed.mac
    ) {
      throw new Error('Invalid encrypted data structure')
    }

    // Convert all components to Buffer
    const encryptedData: EncryptedData = {
      iv: Buffer.from(parsed.iv),
      ephemPublicKey: Buffer.from(parsed.ephemPublicKey),
      ciphertext: Buffer.from(parsed.ciphertext),
      mac: Buffer.from(parsed.mac)
    }

    // Decrypt the data
    const decrypted = await eccrypto.decrypt(
      Buffer.from(privateKey, 'hex'),
      encryptedData
    )

    return decrypted.toString()
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
