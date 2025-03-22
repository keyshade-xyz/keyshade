import eccrypto from 'eccrypto'

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
export const decrypt = (privateKey: string, data: string): Promise<string> => {
  try {
    const parsed = JSON.parse(data) as ParsedData

    const eicesData: EncryptedData = {
      iv: Buffer.from(parsed.iv),
      ephemPublicKey: Buffer.from(parsed.ephemPublicKey),
      ciphertext: Buffer.from(parsed.ciphertext),
      mac: Buffer.from(parsed.mac)
    }

    return eccrypto
      .decrypt(Buffer.from(privateKey, 'hex'), eicesData)
      .then((decrypted) => decrypted.toString())
  } catch (error) {
    return Promise.reject(
      new Error(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
      )
    )
  }
}
