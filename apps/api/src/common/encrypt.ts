import eccrypto from 'eccrypto'

export const encrypt = async (
  publicKey: string,
  data: string
): Promise<string> => {
  const encrypted = await eccrypto.encrypt(
    Buffer.from(publicKey, 'hex'),
    Buffer.from(data)
  )

  return JSON.stringify(encrypted)
}
