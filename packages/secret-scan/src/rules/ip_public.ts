// keyshade-ignore-all
import type { TestCase } from '@/types'

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ip_public(): RegExp[] {
  return [
    /(?<![\w.])((?!(192\.168\.|127\.|10\.|172\.(?:1[6-9]|2[0-9]|3[01])))(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?::\d{1,5})?)(?![\w.])/
  ]
}

const testcase: TestCase[] = [
  { input: '133.133.133.133', expected: true },
  {
    input: 'This line has an IP address 133.133.133.133@something else',
    expected: true
  },
  { input: '133.133.133.133:8080', expected: true },
  {
    input: 'This line has an IP address: 133.133.133.133:8080@something else',
    expected: true
  },
  { input: '1.1.1.1', expected: true },
  { input: '127.0.0.1', expected: false },
  { input: '10.0.0.1', expected: false },
  { input: '172.16.0.1', expected: false },
  { input: '192.168.0.1', expected: false },
  { input: '256.256.256.256', expected: false },
  { input: '1.2.3', expected: false },
  { input: '1.2.3.4.5.6', expected: false },
  { input: '1.2.3.4.5.6.7.8', expected: false },
  { input: '1.2.3.04', expected: false },
  { input: 'noreply@github.com', expected: false },
  { input: 'github.com', expected: false }
]

ip_public.testcases = testcase
