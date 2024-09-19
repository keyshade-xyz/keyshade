// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function dynatrace(): RegExp[] {
	return [
		/dt0c01\.[a-z0-9]{24}\.[a-z0-9]{64}/i,  		// Dynatrace API Token regex
	]
}

const testcase: TestCase[] = [
	{
		input: 'dt0c01.qegcxgkteatilg69j8yz1fnk.kopd89w9rbo1m5wxsyt79g6vaxd0kfjerwntw3se5haebhc5uz08i370vhzg8k4v',
		expected: true
	},
	{
		input: 'dt0c01.7piyhuyhc4x67zn0dbu21i7f.bwkbjqxoau6e6fwyaum979qqcppmj7387c9jf9aaotd6usurjzzccednl3h1wo2e',
		expected: true
	},
	{
		input: 'dt0c01.gait0evjy9w5qzlkc4z6h173.5wgi3lwtr9z6rtsr1ks2jcgn278t16eu9pncqs36qsawr21a28ax0rhdc689lw6o',
		expected: true
	},
	{
		input: 'dt0c01',
		expected: false
	},
	{
		input: 'const = DYNATRACE_API_TOKEN',
		expected: false
	},
	{
		input: 'dynatrace',
		expected: false
	},
	{
		input: 'dt0',
		expected: false
	}
]

dynatrace.testcases = testcase