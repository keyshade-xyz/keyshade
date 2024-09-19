// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function gitlab(): RegExp[] {
	return [
		/glpat-[0-9a-zA-Z\-_]{20}/,  		   // GitLab Personal Access Token  regex
		/glptt-[0-9a-f]{40}/,              // GitLab Pipeline Trigger Token regex
		/GR1348941[0-9a-zA-Z\-_]{20}/      // GitLab Runner Registration Token regex
	]
}

const testcase: TestCase[] = [
	{
		input: 'glpat-a7rhywlOQc22s2wu6ksw',
		expected: true
	},
	{
		input: 'glptt-6a2ebf582d778fbabc413dfa97e0dfd6b4ce5c2e',
		expected: true
	},
	{
		input: 'GR1348941PQrAlrwIUScCvc8l6dWY',
		expected: true
	},
	{
		input: 'const = GITLAB_PERSONAL_ACCESS_TOKEN',
		expected: false
	},
	{
		input: 'const = GITLAB_PIPELINE_TRIGGER_TOKEN',
		expected: false
	},
	{
		input: 'const = GITLAB_RUNNER_REGISTRATION_TOKEN',
		expected: false
	},
	{
		input: 'GITLAB',
		expected: false
	},
	{
		input: 'GIT',
		expected: false
	}
]

gitlab.testcases = testcase