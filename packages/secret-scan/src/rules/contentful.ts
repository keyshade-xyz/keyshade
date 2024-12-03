// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function contentful(): RegExp[] {
  return [
    // Contentful Delivery API Token regex
    /contentful[a-zA-Z0-9=_-]{43}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'contentfulYLQU164W-BXIkhDoqd_8AS3nth7kymzPS5f018-La8F',
    expected: true
  },
  {
    input: 'contentfulA6qqgCW=K7zSIQUiqB4nOfBfqEUvvSXMyACcpKDtQgi',
    expected: true
  },
  {
    input: 'contentfulbk_ZN0LndzhGa1ebsdi-6dnqzOKYoUHF2TrkoT7tZBe',
    expected: true
  },
  {
    input: 'contentfl-ilgKJfRqc_EJo-OlBH0Yc1pSuB-i5tX0pm01o0ypblsxza7299',
    expected: false
  },
  {
    input: 'const = CONTENTFUL_DELIVERY_API_TOKEN',
    expected: false
  },
  {
    input: 'contentful',
    expected: false
  }
]

contentful.testcases = testcase
