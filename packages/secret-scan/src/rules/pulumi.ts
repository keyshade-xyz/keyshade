// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function pulumi(): RegExp[] {
  return [
    // Pulumi API Key regex
    /pul-[a-f0-9]{40}/
  ]
}

const testcase: TestCase[] = [
  {
    input: 'pul-1a07270f686b1c66e1e854e540077aaeea752a6f',
    expected: true
  },
  {
    input: 'pul-3779cd2eb66d752be9b15f03ade833da9652f6fe',
    expected: true
  },
  {
    input: 'pul-',
    expected: false
  },
  {
    input: 'PULUMI',
    expected: false
  }
]

pulumi.testcases = testcase
