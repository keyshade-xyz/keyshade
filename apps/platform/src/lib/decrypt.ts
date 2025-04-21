import { decrypt as decryptModule } from 'eccrypto'

interface EncryptedData {
  iv: Buffer
  ephemPublicKey: Buffer
  ciphertext: Buffer
  mac: Buffer
}

interface ParsedData {
  iv: string | number[] | Buffer
  ephemPublicKey: string | number[] | Buffer
  ciphertext: string | number[] | Buffer
  mac: string | number[] | Buffer
}

/**
 * Decrypts data encrypted with ECIES
 * @param privateKey - The private key in hex format
 * @param data - The encrypted data as a JSON string
 * @returns Promise resolving to the decrypted string
 */
export const decrypt = async (
  privateKey: string,
  data: string
): Promise<string> => {
  try {
    const parsed = JSON.parse(data) as ParsedData

    // Helper to normalize into a Buffer
    const toBuffer = (
      input: string | number[] | Buffer,
      encoding: BufferEncoding = 'hex'
    ): Buffer => {
      if (Buffer.isBuffer(input)) {
        return input
      } else if (Array.isArray(input)) {
        return Buffer.from(input)
      }
      // string case: assume hex-encoded by default
      return Buffer.from(input, encoding)
    }

    const encrypted: EncryptedData = {
      iv: toBuffer(parsed.iv),
      ephemPublicKey: toBuffer(parsed.ephemPublicKey),
      ciphertext: toBuffer(parsed.ciphertext),
      mac: toBuffer(parsed.mac)
    }

    // decrypt with the private key (hex → Buffer)
    const decrypted = await decryptModule(
      Buffer.from(privateKey, 'hex'),
      encrypted
    )

    return decrypted.toString()
  } catch (error) {
    return Promise.reject(
      new Error(
        `Decryption failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    )
  }
}
