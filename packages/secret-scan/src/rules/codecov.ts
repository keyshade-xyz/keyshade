// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function codecov(): RegExp[] {
  return [
    // Codecov key regex
    /codecov[a-zA-Z0-9]{32}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'codecovAbCX3o2TN37M4k0cYrz0NQ1zMRjKQBdF',
    expected: true
  },
  {
    input: 'codecovF9o7VI9C5UK7AVtbDekciUKXtqUCo1wW',
    expected: true
  },
  {
    input: 'codecovk8XIDtAkz1YI96G94Fyo41xrrHSotagU',
    expected: true
  },
  {
    input: 'codecov0pm01o0ypb0p76uul9w07q8zzae-6iytk3p4kejlsxza',
    expected: false
  },
  {
    input: 'codecov',
    expected: false
  },
  {
    input: 'code',
    expected: false
  }
]

codecov.testcases = testcase
