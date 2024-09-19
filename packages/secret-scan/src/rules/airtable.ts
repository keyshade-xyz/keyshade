// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function airtable(): RegExp[] {
  return [
    // Airtable API key regex
    /airtable[a-zA-Z0-9]{17}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'airtable2rLtMsryk9N1tLuVF',
    expected: true
  },
  {
    input: 'airtable2rLtMsryk9N1tLuVF2rLtMsryk9N1tLuVF2rLtMsryk9N1tLuVF',
    expected: true
  },
  {
    input: 'airtablel8MNUldzSzmplyVEQ',
    expected: true
  },
  {
    input: 'airtable2rLtMsryk9N1',
    expected: false
  },
  {
    input: 'airtable',
    expected: false
  }
]

airtable.testcases = testcase