// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function duffel(): RegExp[] {
	return [
		/duffel_(?:test|live)_[a-z0-9_\-=]{43}/i,  		// Duffel API Token regex
	]
}

const testcase: TestCase[] = [
	{
		input: 'duffel_live_ov4m2czrp7d7kn-i3uk5hvu8y2v9iz9xo2f=9nt2ie5',
		expected: true
	},
	{
		input: 'duffel_test_9puxwrgem1nus5z9w6791nhiwz74agyhe3iph9fdoa1',
		expected: true
	},
	{
		input: 'duffel_test_',
		expected: false
	},
	{
		input: 'duffel_live_',
		expected: false
	},
	{
		input: 'const = DUFFEL_API_TOKEN',
		expected: false
	},
	{
		input: '_live_',
		expected: false
	},
	{
		input: '_test_',
		expected: false
	}
]

duffel.testcases = testcase