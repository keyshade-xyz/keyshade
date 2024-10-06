export interface TestCase {
  input: string
  expected: boolean
}

export interface SecretResult {
  found: boolean
  regex?: RegExp
}
