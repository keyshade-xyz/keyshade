// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function rubygems(): RegExp[] {
	return [
		// Ruby Gems API Key regex
		/rubygems_[a-f0-9]{48}/
	]
}

const testcase: TestCase[] = [
	{
		input: 'rubygems_fb6bff4ec114a74a96c4cd82bd34969fbc7873b15f4a0465',
		expected: true
	},
	{
		input: 'rubygems_afff37f44056352348e9b97b33315e55792c0680841ba6bd',
		expected: true
	},
	{
		input: 'rubygems_',
		expected: false
	},
	{
		input: 'RubyGems',
		expected: false
	}
]

rubygems.testcases = testcase