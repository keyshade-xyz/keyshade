// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function bittrex(): RegExp[] {
	return [
		// Bittrex key regex
		/bittrex[a-zA-Z0-9]{32}/i
	]
}

const testcase: TestCase[] = [
  {
    input: 'bittrexhyjxjBrkQuhaaTc89ssq5HiFj4JxwIHw',
    expected: true
  },
  {
    input: 'bittrexljSIB7ZMyucZcLPLXgieRoZb2LnDmT4y',
    expected: true
  },
  {
    input: 'bittrexyt49akFVgn55oGSSavNeitEOMPopYxd9',
    expected: true
  },
  {
    input: 'ber_0pm01o0ypb0p76uul9w07q8zzae-6iytk3p4kejlsxza',
    expected: false
  },
  {
    input: 'bittwsgufeg',
    expected: false
  },
  {
    input: 'bittrex',
    expected: false
  }
]

bittrex.testcases = testcase
