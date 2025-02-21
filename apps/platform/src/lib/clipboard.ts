import { createElement } from 'react'
import { toast } from 'sonner'

export function copyToClipboard(
  message: string,
  successMsg = 'Text copied to clipboard!',
  errorMsg = 'Failed to copy text.',
  description?: string
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- navigator.clipboard is checked
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(message)
      .then(() => toast.success(successMsg, {
        description: description ? createElement('p', { className: 'text-xs text-green-300' }, description) : null,
      }))
      .catch((error) => {
        toast.error(errorMsg, {
          description: description ? createElement('p', { className: 'text-xs text-red-300' }, description) : null,
        })
        // eslint-disable-next-line no-console -- console.error is used for debugging
        console.error(errorMsg, error)
      })
  } else {
    // Fallback for browsers that don't support the Clipboard API
    // eslint-disable-next-line no-console -- console.log is used for debugging
    console.warn('Clipboard API not supported')

    const textarea = document.createElement('textarea')
    textarea.value = message
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      toast.success(successMsg)
    } catch (error) {
      toast.error(errorMsg)
      // eslint-disable-next-line no-console -- console.error is used for debugging
      console.error(errorMsg, error)
    } finally {
    document.body.removeChild(textarea)
    }
  }
}
