// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function heroku(): RegExp[] {
	return [
		// Heroku API Key regex ( UUID like pattern )
		/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/
	]
}

const testcase: TestCase[] = [
	{
		input: 'E3D24DAc-7c5D-Aacd-fafF-3cc0c70e2ccc',
		expected: true
	},
	{
		input: 'AAD43dca-DBFc-4aEc-c86c-D57D57CAefb2',
		expected: true
	},
	{
		input: 'FdA859B1-7D9a-f3e0-fAC3-E4ae6FbEEfBA',
		expected: true
	},
	{
		input: 'AADdca-DBFc-4aEc-c86c-D57D57CAefb2',
		expected: false
	},
	{
		input: 'AAD43dca-DBFc-4aEc-c86c-D7CAefb2',
		expected: false
	},
	{
		input: 'AAD43dca-Dc-Ec-cc-D57D57CAefb2',
		expected: false
	}
]

heroku.testcases = testcase