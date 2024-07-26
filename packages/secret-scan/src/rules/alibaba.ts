// keyshade-ignore-all
import type { TestCase } from '@/types'

/**
 * ref. https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair
 * ref. https://www.alibabacloud.com/help/en/kms/getting-started/getting-started-with-secrets-manager
 */
export default function alibaba(): RegExp[] {
  return [/LTAI[a-zA-Z0-9]{20}/, /alibaba[a-zA-Z0-9]{30}/]
}

const testcase: TestCase[] = [
  {
    input: 'LTAImMJ3WeEGdicOCbV46WvW',
    expected: true
  },
  {
    input: 'LTAImLROAlJeOHPCwGO4XSq4',
    expected: true
  },
  {
    input: 'alibaba8HaH5W4jXvfsnhSTGexa7GHxAN1dFS',
    expected: true
  },
  {
    input: 'alibabacZ0AzL13uJ41QJb1aBqtUdeLvUqXCy',
    expected: true
  },
  {
    input: 'ltaiisud',
    expected: false
  },
  {
    input: 'alibaba12345678',
    expected: false
  }
]

alibaba.testcases = testcase
