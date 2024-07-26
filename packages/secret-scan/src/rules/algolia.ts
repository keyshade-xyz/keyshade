// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function algolia(): RegExp[] {
  return [/algolia[a-z0-9]{32}/]
}

const testcase: TestCase[] = [
  {
    input: 'algoliaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    expected: true
  },
  {
    input: 'algoliah4bcd02zptmr75xlzqnktb70yy6mvnty',
    expected: true
  },
  {
    input: 'algoliarc0hti92e73wvwclqdoejexui7vbqf6g',
    expected: true
  },
  {
    input: "const algolia = require('algolia');",
    expected: false
  },
  {
    input: 'algolia',
    expected: false
  }
]

algolia.testcases = testcase
