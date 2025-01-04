export interface TestCase {
  input: string
  expected: boolean
}

export interface SecretResult {
  found: boolean
  regex?: RegExp
}

export interface JsObjectScanResult {
  secrets: Record<string, string>
  variables: Record<string, string>
}
