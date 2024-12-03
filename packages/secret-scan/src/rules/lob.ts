// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function lob(): RegExp[] {
  return [
    // Lob API (1. Publishable, 2. Normal) Key regex
    /(test|live)(_|_pub_)[a-f0-9]{31}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'test_pub_ba8b57a94ac56f4920c74e2be50dc02',
    expected: true
  },
  {
    input: 'live_ca949625109cf9648c17925b854d1e1',
    expected: true
  },
  {
    input: 'test_9b3c24b9cafee0072d56ddd496adb82',
    expected: true
  },
  {
    input: 'live_pub_c4a7332fc4c74ab259a5d96ab1e7397',
    expected: true
  },
  {
    input: 'live_',
    expected: false
  },
  {
    input: '_pub_',
    expected: false
  }
]

lob.testcases = testcase
