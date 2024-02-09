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

  it('should encrypt and decrypt a string', () => {
    const keyPair = createKeyPair()
    const plaintext = 'hello world'
    const encrypted = encrypt(keyPair.publicKey, plaintext)
    const decrypted = decrypt(keyPair.privateKey, encrypted)
    expect(decrypted).toEqual(plaintext)
  })

  it('should fail to encrypt and decrypt a string', () => {
    const keyPair = createKeyPair()
    const plainText = 'hello world'
    const encrypted = encrypt(keyPair.publicKey, plainText)
    const modifiedText = 'modified hello world'
    const decrypted = decrypt(keyPair.privateKey, encrypted)
    expect(decrypted).not.toEqual(modifiedText)
  })

  const object = {
    id: '1',
    name: 'John Doe',
    email: 'johndoe@keyshade.xyz',
    profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
    isActive: true,
    isOnboardingFinished: false,
    isAdmin: false
  }

  it('should exclude fields', () => {
    const excluded = excludeFields(object, 'isActive')
    expect(excluded).not.toHaveProperty('isActive')
    expect(excluded).toEqual({
      ...object,
      isActive: undefined
    })
  })

  it ('should fail to exclude fields', () => {    
    const excluded = excludeFields(object, 'isActive')
    excluded.isActive = true
    expect(excluded).toHaveProperty('isActive')
    expect(excluded).toEqual({
      ...object,
      isActive: true
    })
  })
})
