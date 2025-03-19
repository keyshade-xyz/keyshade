/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Decrypts a given encrypted data using a given private key.
 *
 * @param privateKey - The private key to use for decryption.
 * @param data - The encrypted data to decrypt.
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
