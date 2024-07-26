// keyshade-ignore-all
import type { TestCase } from '@/types'

/**
 * ref. https://core.telegram.org/bots/api#authorizing-your-bot
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function telegram_token(): RegExp[] {
  return [/\d{8,10}:[0-9A-Za-z_-]{35}/]
}

const testcase: TestCase[] = [
  {
    input: 'bot110201543:AAHdqTcvCH1vGWJxfSe1ofSAs0K5PALDsaw',
    expected: true
  },
  {
    input: '110201543:AAHdqTcvCH1vGWJxfSe1ofSAs0K5PALDsaw',
    expected: true
  },
  {
    input: '7213808860:AAH1bjqpKKW3maRSPAxzIU-0v6xNuq2-NjM',
    expected: true
  },
  {
    input: 'foo:AAH1bjqpKKW3maRSPAxzIU-0v6xNuq2-NjM',
    expected: false
  },
  {
    input: 'aritra',
    expected: false
  }
]

telegram_token.testcases = testcase
