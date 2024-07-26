// keyshade-ignore-all
import type { TestCase } from '@/types'

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function square_OAuth(): RegExp[] {
  return [/sq0csp-[0-9A-Za-z\\\-_]{43}/]
}

const testcase: TestCase[] = [
  {
    input: 'sq0csp-AJ4xrThe5XvY9lCWDtmE\\AxWdK7sK8zktV_y\\ZDTzyq',
    expected: true
  },
  {
    input: 'kriptonian',
    expected: false
  },
  {
    input: 'sq0csp-ABCDEFGHIJK_LMNOPQRSTUVWXYZ-0123456789-DHUSKDNJSLKJN',
    expected: true
  }
]

square_OAuth.testcases = testcase
