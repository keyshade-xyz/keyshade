export type MimeType = `${string}/${string}`

/**
 * Initiates a download of a file with the specified content, filename, and MIME type.
 *
 * @param content - The content to be included in the downloaded file.
 * @param filename - The name for the downloaded file.
 * @param mimeType - The MIME type of the file. Defaults to 'text/plain'.
 */
export function downalodFile(
  content: string,
  filename: string,
  mimeType: MimeType = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
