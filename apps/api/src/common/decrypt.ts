import { createPrivateKey, privateDecrypt } from 'crypto'

export const decrypt = (privateKey: string, data: string): string => {
  const privateKeyPEM = createPrivateKey({
    key: privateKey,
    format: 'pem'
  })

  const buffer = Buffer.from(data, 'base64')
  const decrypted = privateDecrypt(privateKeyPEM, buffer)
  return decrypted.toString('utf8')
}
