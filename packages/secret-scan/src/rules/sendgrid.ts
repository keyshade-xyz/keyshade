// keyshade-ignore-all
import type { TestCase } from '@/types'

/**
 * ref. https://d2w67tjf43xwdp.cloudfront.net/Classroom/Basics/API/what_is_my_api_key.html
 */
export default function sendgrid(): RegExp[] {
  return [/SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/]
}

const testcase: TestCase[] = [
  {
    input:
      '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',
    expected: true
  },
  {
    input:
      'SG.ngeVfQFYQlKU0ufo8x5d1A..TwL2iGABf9DHoTf-09kqeF8tAmbihYzrnopKc-1s5cr',
    expected: false
  },
  {
    input:
      'AG.ngeVfQFYQlKU0ufo8x5d1A.TwL2iGABf9DHoTf-09kqeF8tAmbihYzrnopKc-1s5cr',
    expected: false
  },
  {
    input: 'swatilakha',
    expected: false
  }
]

sendgrid.testcases = testcase
