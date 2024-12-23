import denylist from '@/denylist'
import type { SecretResult, ScanJsObjectResult } from '@/types'

export type SecretConfig = Record<string, RegExp[]>

class SecretDetector {
  private readonly patterns: RegExp[]
  constructor(config: SecretConfig) {
    this.patterns = Object.values(config).flat()
  }

  /**
   * Detects if a given input string contains any secret patterns.
   * @param input - The input string to scan for secret patterns.
   * @returns A `SecretResult` object indicating whether any secret patterns were found.
   */
  detect(input: string): SecretResult {
    for (const regex of this.patterns) {
      if (regex.test(input)) {
        return { found: true, regex }
      }
    }
    return { found: false }
  }

  /**
   * Detects if a given js object contains any secret patterns.
   * @param input - The object to scan for secret patterns.
   * @returns A `ScanJsObjectResult` object containing the secrets and variables found in the object.
   */
  detectJsObject(input: Record<string, string>): ScanJsObjectResult {
    const result: ScanJsObjectResult = {
      secrets: {},
      variables: {}
    }
    for (const [key, value] of Object.entries(input)) {
      const secretResult = this.detect(value)
      if (secretResult.found) {
        result.secrets[key] = value
      } else {
        result.variables[key] = value
      }
    }

    return result
  }
}

const createSecretDetector = (config: SecretConfig): SecretDetector => {
  return new SecretDetector(config)
}

const secretDetector = createSecretDetector(denylist)

export default secretDetector
