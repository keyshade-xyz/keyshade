import * as eccrypto from 'eccrypto'

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
