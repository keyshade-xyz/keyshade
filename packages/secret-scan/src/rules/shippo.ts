// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function shippo(): RegExp[] {
	return [
		// Shippo API Key regex
		/shippo_(live|test)_[a-f0-9]{40}/i
	]
}

const testcase: TestCase[] = [
	{
		input: 'shippo_test_db8536f152f40910e83640bc9567783f3ac7965f',
		expected: true
	},
	{
		input: 'shippo_live_e844246554cebd546a8b2cce0aad583992368c82',
		expected: true
	},
	{
		input: 'shippo_',
		expected: false
	},
	{
		input: 'Shippo',
		expected: false
	}
]

shippo.testcases = testcase