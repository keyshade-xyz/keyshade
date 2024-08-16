// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function adobe(): RegExp[] {
  return [/adobe[a-fA-F0-9]{32}|p8e-[a-zA-Z0-9]{32}/]
}

const testcase: TestCase[] = [
  {
    input: 'adobe43FCE84400d6ec588033AA9471e1a92D',
    expected: true
  },
  {
    input: 'adobe1234567890123456789012345678',
    expected: false
  },
  {
    input: 'adobe123',
    expected: false
  },
  {
    input: 'p8e-ymBmuzCzo0eWWQnlafeHSOxkb61cC4kG',
    expected: true
  },
  {
    input: 'p8e-1234567890123456789012345678',
    expected: false
  },
  {
    input: 'p8e-123',
    expected: false
  }
]

adobe.testcases = testcase
