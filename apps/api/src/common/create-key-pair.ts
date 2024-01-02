import { generateKeyPairSync } from 'crypto'

export const createKeyPair = (): {
  publicKey: string
  privateKey: string
} => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048
  })

  const publicKeyPEM = publicKey.export({ type: 'pkcs1', format: 'pem' })
  const privateKeyPEM = privateKey.export({ type: 'pkcs1', format: 'pem' })

  return {
    publicKey: publicKeyPEM.toString(),
    privateKey: privateKeyPEM.toString()
  }
}
