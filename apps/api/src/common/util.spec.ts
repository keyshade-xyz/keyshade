import { createKeyPair } from './create-key-pair'
import { decrypt } from './decrypt'
import { encrypt } from './encrypt'
import { excludeFields } from './exclude-fields'

describe('util', () => {
  it('should be defined', () => {
    expect(createKeyPair).toBeDefined()
    expect(decrypt).toBeDefined()
    expect(encrypt).toBeDefined()
    expect(excludeFields).toBeDefined()
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
    const differenetKeyPair = createKeyPair()
    const plainText = 'hello world'
    const encrypted = await encrypt(keyPair.publicKey, plainText)
    const decrypted = await decrypt(differenetKeyPair.privateKey, encrypted)
    expect(decrypted).toThrow()
  })

  it('should exclude fields', () => {
    const object = {
      id: '1',
      name: 'John Doe',
      email: 'johndoe@keyshade.xyz',
      profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
      isActive: true,
      isOnboardingFinished: false,
      isAdmin: false
    }

    const excluded = excludeFields(object, 'isActive')
    expect(excluded).not.toHaveProperty('isActive')
    expect(excluded).toEqual({
      ...object,
      isActive: undefined
    })
  })
})
