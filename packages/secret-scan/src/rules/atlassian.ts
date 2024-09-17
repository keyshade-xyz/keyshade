// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function atlassian(): RegExp[] {
	return [
		// Atlassian API key starts with atlassian, confluence and jira
		/(?:atlassian|confluence|jira)[a-zA-Z0-9]{24}/i
	]
}

const testcase: TestCase[] = [
	{
		input: 'confluenceojqhLdXTkuq6evzHPAxG4Gec',
		expected: true
	},
	{
		input: 'jirai2rfog2lrLrchssWRvvqcAak',
		expected: true
	},
	{
		input: 'jiraStCBHh8bkPREl880xgj2c5Pr',
		expected: true
	},
	{
		input: 'atlassianruJGQgh186T1VsJj92Zevl4g',
		expected: true
	},
	{
		input: 'confluencePVupYYBa4jwjTLGPbH0uc6re',
		expected: true
	},
	{
		input: 'atlassianfokyIISToCvOLu37Ghwgmg9B',
		expected: true
	},
	{
		input: 'confluencebzql7VAKbEZIa4sPHe9oAd8x',
		expected: true
	},
	{
		input: 'jiraYEsx1YgYlJhx7PZWiL45BnuP',
		expected: true
	},
	{
		input: 'jiraZsWvU6UYKj40x1JT7L8k3kFS',
		expected: true
	},
	{
		input: 'confluence27GqJEFNkhUqkNLti86QUBX0',
		expected: true
	},
	{
		input: 'atlassian',
		expected: false
	},
	{
		input: 'confluence',
		expected: false
	},
	{
		input: 'jira',
		expected: false
	}
]

atlassian.testcases = testcase
