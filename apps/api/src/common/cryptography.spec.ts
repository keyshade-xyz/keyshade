import { decrypt, encrypt } from '@keyshade/common'
import { createKeyPair, generateApiKey, toSHA256 } from './cryptography'

describe('Cryptography Tests', () => {
  it('should be defined', () => {
    expect(createKeyPair).toBeDefined()
    expect(decrypt).toBeDefined()
    expect(encrypt).toBeDefined()
    expect(generateApiKey).toBeDefined()
    expect(toSHA256).toBeDefined()
  })

  it('should create a key pair', () => {
    const keyPair = createKeyPair()
    expect(keyPair).toBeDefined()
    expect(keyPair.publicKey).toBeDefined()
    expect(keyPair.privateKey).toBeDefined()
  })

  it('should encrypt and decrypt a string', async () => {
    const keyPair = createKeyPair()
    const plaintext = 'hello world'
    const encrypted = await encrypt(keyPair.publicKey, plaintext)
    const decrypted = await decrypt(keyPair.privateKey, encrypted)
    expect(decrypted).toEqual(plaintext)
  })

  it('should fail to encrypt and decrypt a string', async () => {
    const keyPair = createKeyPair()
    const differentKeyPair = createKeyPair()
    const plainText = 'hello world'
    const encrypted = await encrypt(keyPair.publicKey, plainText)
    try {
      await decrypt(differentKeyPair.privateKey, encrypted)
    } catch (e) {
      expect(e).toBeDefined()
      expect(e.message).toEqual('Bad MAC')
    }
  })

  it('should generate an API key', () => {
    const apiKey = generateApiKey()
    expect(apiKey).toBeDefined()
    expect(apiKey).toBeDefined()
  })

  it('should generate a SHA256 hash', () => {
    const hash = toSHA256('hello world')
    expect(hash).toBeDefined()
    expect(hash).toEqual(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
    )
  })
})
