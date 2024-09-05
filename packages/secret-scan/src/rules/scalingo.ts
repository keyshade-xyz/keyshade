// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function scalingo(): RegExp[] {
	return [
		// Scalingo API Key regex
		/tk-us-[a-zA-Z0-9-_]{48}/
	]
}

const testcase: TestCase[] = [
	{
		input: 'tk-us-TPdFpIyuvXJLQytNSugN3RBeN0YYLed3ib1b7uJiPqk_XAws',
		expected: true
	},
	{
		input: 'tk-us-h0rx7zIiaoFsmloQDcfCdkhaAljG9QjQRkmuF894qCCnp4XX',
		expected: true
	},
	{
		input: 'tk-us-',
		expected: false
	},
	{
		input: 'Scalingo',
		expected: false
	}
]

scalingo.testcases = testcase