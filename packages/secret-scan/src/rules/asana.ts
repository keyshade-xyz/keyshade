// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function asana(): RegExp[] {
	return [
		// Asana API key regex
		/asana(?:[0-9]{16}|[a-zA-Z0-9]{32})/i
	]
}

const testcase: TestCase[] = [
	{
		input: 'asana7127506407697088',
		expected: true
	},
	{
		input: 'asanauqojiVXgDOUXY33pSof0IHG0wQAInfRX',
		expected: true
	},
	{
		input: 'asana',
		expected: false
	},
	{
		input: 'asana123',
		expected: false
	},
	{
		input: 'asanahsdiu3nniwoien',
		expected: false
	}
]

asana.testcases = testcase
