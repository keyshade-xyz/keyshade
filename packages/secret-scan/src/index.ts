import denylist from '@/denylist'
import type { SecretResult } from '@/types'

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
}

const createSecretDetector = (config: SecretConfig): SecretDetector => {
  return new SecretDetector(config)
}

const secretDetector = createSecretDetector(denylist)

export default secretDetector
