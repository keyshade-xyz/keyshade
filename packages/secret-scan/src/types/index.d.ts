export interface TestCase {
  input: string
  expected: boolean
}

export interface SecretResult {
  found: boolean
  regex?: RegExp
}

export interface ScanObjectResult {
  secrets: string[][] // string[] -> [key, value]
  variables: string[][] // string[] -> [key, value]
}
