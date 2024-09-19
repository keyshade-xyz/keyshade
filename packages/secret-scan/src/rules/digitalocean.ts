// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function digitalocean(): RegExp[] {
	return [
		/dop_v1_[a-f0-9]{64}/i,  		// DigitalOcean Personal Access Token
		/doo_v1_[a-f0-9]{64}/i,			// DigitalOcean OAuth Token
		/dor_v1_[a-f0-9]{64}/i      // DigitalOcean Refresh Token
	]
}

const testcase: TestCase[] = [
	{
		input: 'dop_v1_6ebe0710b1c8c5d3a30150d1b07f3cd3517ca0cad9c98b0b8d67b36a522ee9ae',
		expected: true
	},
	{
		input: 'doo_v1_8942e3f6cfd015bda398f07e39f7d5ecd86a93b9d0d0d858e07b07c69a7e9094',
		expected: true
	},
	{
		input: 'dor_v1_281d007c3055850a8b19c1b610cd447595eccf3c32a601f74c596fa84b59319d',
		expected: true
	},
	{
		input: 'DIGITAL_OCEAN',
		expected: false
	},
	{
		input: 'const = DIGITAL_OCEAN_API_TOKEN',
		expected: false
	},
	{
		input: 'dor_',
		expected: false
	},
	{
		input: 'dop_',
		expected: false
	}
]

digitalocean.testcases = testcase