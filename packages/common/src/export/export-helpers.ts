import { decrypt } from '../cryptography'
import { ExportFormat } from './export-types'
import { formatExport } from './export-service'

const decryptAllSecrets = async (
  secrets: Array<{ name: string; value: string }>,
  privateKey: string
): Promise<Array<{ name: string; value: string }>> =>
  secrets.length === 0
    ? []
    : await Promise.all(
        secrets.map(
          async ({ name, value: encrypted }) =>
            await decrypt(privateKey, encrypted).then((value) => ({
              name,
              value
            }))
        )
      )

export const buildEnvFiles = async (
  envSlug: string,
  secrets: Array<{ name: string; value: string }>,
  variables: Array<{ name: string; value: string }>,
  privateKey: string,
  formatKey: string,
  separateFiles: boolean
): Promise<Array<{ filename: string; content: string }>> => {
  const decrypted = await decryptAllSecrets(secrets, privateKey)
  const format = ExportFormat[formatKey]
  if (!format) throw new Error(`Unsupported format "${formatKey}"`)

  if (separateFiles) {
    const secretFile = formatExport({ secrets: decrypted }, format)
    const varFile = formatExport({ variables }, format)

    return [
      { filename: `${envSlug}.secrets`, content: secretFile },
      { filename: `${envSlug}.variables`, content: varFile }
    ]
  }

  const combined = formatExport({ secrets: decrypted, variables }, format)
  return [{ filename: `${envSlug}`, content: combined }]
}
