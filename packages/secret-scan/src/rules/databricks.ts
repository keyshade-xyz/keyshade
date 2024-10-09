// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function databricks(): RegExp[] {
  return [
    // Databricks API Token Regex
    /dapi[a-h0-9]{32}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'dapi9e9e452a35ah334788h284he1641ce9d',
    expected: true
  },
  {
    input: 'dapi8ccbe94fhcfb10c1d8e3abaae92a37a3',
    expected: true
  },
  {
    input: 'dapig35c98ghc3fg20c6cceb2b4852ghcbgb',
    expected: true
  },
  {
    input: 'dapi',
    expected: false
  },
  {
    input: 'const = DATABRICKS_API_KEY_TOKEN',
    expected: false
  },
  {
    input: 'DATABRICKS',
    expected: false
  }
]

databricks.testcases = testcase
