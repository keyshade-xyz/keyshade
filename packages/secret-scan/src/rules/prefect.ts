// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function prefect(): RegExp[] {
	return [
		// Prefect API Token regex
		/pnu_[a-z0-9]{36}/
	]
}

const testcase: TestCase[] = [
	{
		input: 'pnu_uv8cueiemumn0xos0s2e3u2xrt8e61temlan',
		expected: true
	},
	{
		input: 'pnu_2be7m5lzmyv47mwsgd1y3ochncyn9a6lltq1',
		expected: true
	},
	{
		input: 'pnu_',
		expected: false
	},
	{
		input: 'PREFECT',
		expected: false
	}
]

prefect.testcases = testcase