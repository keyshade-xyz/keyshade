// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function linear(): RegExp[] {
	return [
		// Linear API Key regex
		/lin_api_[a-z0-9]{40}/i
	]
}

const testcase: TestCase[] = [
	{
		input: 'lin_api_pfwfydji40fvlknog3166f9hvlvqfr1d8odknvr3',
		expected: true
	},
	{
		input: 'lin_api_efzosrmg5ziv9z9v3iq75s8pdyb80qxztk58trza',
		expected: true
	},
	{
		input: 'lin_api_s53gd3ky47rsnqpidr1jj1bjsgpdhr30',
		expected: false
	},
	{
		input: 'lin_api_',
		expected: false
	}
]

linear.testcases = testcase