// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function doppler(): RegExp[] {
	return [
		/dp\.pt\.[a-z0-9]{43}/i,  		// Doppler API Token regex
	]
}

const testcase: TestCase[] = [
	{
		input: 'dp.pt.x6larkn5ztqmlk5u61p5l7do894mn24c2vrew90le7l',
		expected: true
	},
	{
		input: 'dp.pt.ec7m7djndnz5hwcbvkz4aou1n21aor5cthu9ophkohg',
		expected: true
	},
	{
		input: 'dp.pt.zroxmgl1lqgq6t0mp2sbr3bxm802tuay3zztmg8edfd',
		expected: true
	},
	{
		input: 'doppler',
		expected: false
	},
	{
		input: 'const = DOPPLER_API_TOKEN',
		expected: false
	},
	{
		input: 'dp.',
		expected: false
	},
	{
		input: '.pt.',
		expected: false
	}
]

doppler.testcases = testcase