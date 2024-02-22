import * as eccrypto from 'eccrypto'

export const createKeyPair = (): {
  publicKey: string
  privateKey: string
} => {
  const privateKey = eccrypto.generatePrivate()
  const publicKey = eccrypto.getPublic(privateKey)

  return {
    publicKey: publicKey.toString('hex'),
    privateKey: privateKey.toString('hex')
  }
}
