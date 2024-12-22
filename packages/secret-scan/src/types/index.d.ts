export interface TestCase {
  input: string
  expected: boolean
}

export interface SecretResult {
  found: boolean
  regex?: RegExp
}

export interface ScanObjectResult {
  secrets: Array<string[]> // string[] -> [key, value]
  variables: Array<string[]> // string[] -> [key, value]
}
