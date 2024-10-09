// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function sendinblue(): RegExp[] {
  return [
    // SendInBlue API Key regex
    /xkeysib-[a-f0-9]{64}-[a-z0-9]{16}/i
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
    input: 'xkeysib-',
    expected: false
  },
  {
    input: 'SENDINBLUE',
    expected: false
  }
]

sendinblue.testcases = testcase
