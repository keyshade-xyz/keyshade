/**
 * Extracts a formatted error message from an error response.
 * Handles two cases:
 * 1. JSON stringified version with header and body: returns "header: body"
 * 2. Plain string: returns the string as-is
 *
 * @param errorMessage - The error message that may be a JSON string or plain string
 * @returns The formatted error message
 */
export function extractErrorMessage(errorMessage: string): string {
  if (!errorMessage) {
    return 'An unknown error occurred'
  }

  try {
    const parsed = JSON.parse(errorMessage) as {
      header?: string
      body?: string
    }

    if (parsed.header && parsed.body) {
      return `${parsed.header}: ${parsed.body}`
    }

    return errorMessage
  } catch {
    return errorMessage
  }
}
