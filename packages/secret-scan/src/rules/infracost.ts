// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function infracost(): RegExp[] {
	return [
		// Infracost API Key regex
		/ico-[a-zA-Z0-9]{32}/
	]
}

const testcase: TestCase[] = [
	{
		input: 'ico-xgKpukMuYNOpYRwdW9VFW1lUcBdgNoiu',
		expected: true
	},
	{
		input: 'ico-nG06pZj4mJAMiBlX0jHsnMgfGFtJlhyu',
		expected: true
	},
	{
		input: 'ico-nG06pZj4mJAMewtiueye',
		expected: false
	},
	{
		input: 'ico-',
		expected: false
	}
]

infracost.testcases = testcase