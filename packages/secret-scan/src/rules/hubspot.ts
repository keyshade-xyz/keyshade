// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function hubspot(): RegExp[] {
	return [
		// Hubspot API Key regex
		/\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/
	]
}

const testcase: TestCase[] = [
	{
		input: '6CA76A92-AC2A-8798-B0DD-DC55F0FD2718',
		expected: true
	},
	{
		input: '17EEDBBE-B310-B60F-D37F-5902082CA2F2',
		expected: true
	},
	{
		input: 'F74407A5-64B8-1C17-C90D-A3613B216A0B',
		expected: true
	},
	{
		input: '17EEDBBE-B310-B60F-D37F-5902082CA',
		expected: false
	},
	{
		input: '17EEE-B310-B60F-D37F-5902082CA2F2',
		expected: false
	},
	{
		input: '17EEDBBE-B0-B0F-D-5902082CA2F2',
		expected: false
	}
]

hubspot.testcases = testcase