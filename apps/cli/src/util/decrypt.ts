/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as eccrypto from 'eccrypto'

export const decrypt = async (
  privateKey: string,
  data: string
): Promise<string> => {
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
