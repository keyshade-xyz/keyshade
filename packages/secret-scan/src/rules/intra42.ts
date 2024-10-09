// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function intra42(): RegExp[] {
  return [
    // Intra42 Client Secret regex
    /s-s4t2(?:ud|af)-[a-f0-9]{64}/
  ]
}

const testcase: TestCase[] = [
  {
    input:
      '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',
    expected: true
  },
  {
    input:
      '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',
    expected: true
  },
  {
    input: 's-s4t2ud-03c69e8cad5ba22c8a947038931a391e4849eba9866dc065ea02d3',
    expected: false
  },
  {
    input:
      's-s4td-03c69e8cad5ba22c8a9470639238931a391e4849eba9866dc065ea02d353ef01wejht72934',
    expected: false
  },
  {
    input: 's-s4t2ud-',
    expected: false
  },
  {
    input: 's-s4t2af-',
    expected: false
  }
]

intra42.testcases = testcase
