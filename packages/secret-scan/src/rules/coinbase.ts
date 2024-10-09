// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function coinbase(): RegExp[] {
  return [/coinbase[a-zA-Z0-9=_\-]{64}/i]
}

const testcase: TestCase[] = [
  {
    input:
      'coinbase6-xXTZ5MlBlJsQtO9FhPYeRKelvoxhP5rTzfHsmL0aoJL32XFnL-SDKK142FoXMn',
    expected: true
  },
  {
    input:
      'coinbasev17P-2zbH=sG0DOhjOeM5AssQdss26wFpKl1jDj0avwk7E99YyJsdVU_cADE6ef3',
    expected: true
  },
  {
    input:
      'coinbase-ilgKJfRqc_EJoPgyWpwGeW-nQZ-U0hHiWxmi7H78KIYI=-OlBH0Yc1pSuB-i5tX',
    expected: true
  },
  {
    input: 'coinbase-ilgKJfRqc_EJo-OlBH0Yc1pSuB-i5tX0pm01o0ypblsxza',
    expected: false
  },
  {
    input: 'const = COINBASE_API_KEY',
    expected: false
  },
  {
    input: 'coinbase',
    expected: false
  }
]

coinbase.testcases = testcase
