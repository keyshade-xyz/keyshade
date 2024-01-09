import { createPublicKey, publicEncrypt } from 'crypto'

export const encrypt = (publicKey: string, data: string): string => {
  const publicKeyPEM = createPublicKey({
    key: publicKey,
    format: 'pem'
  })

  const messageBuffer = Buffer.from(data)
  const encrypted = publicEncrypt(publicKeyPEM, messageBuffer)
  return encrypted.toString('base64')
}
