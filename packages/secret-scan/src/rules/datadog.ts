// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function datadog(): RegExp[] {
	return [
		// Datadog API Token Regex
		/datadog[a-zA-Z0-9]{40}/i
	]
}

const testcase: TestCase[] = [
	{
		input: 'datadogVzwYnTLnKQAgYWPWdqmNtbYpoHkN4SaEBj5JwGMy',
		expected: true
	},
	{
		input: 'datadogSnxRlia4291mrcP7KX9KNUaT1FglR3xMAnJyu31C',
		expected: true
	},
	{
		input: 'datadogks1mBWX1PsNCwCByU8pV8shws1UuUhLx86OdslbO',
		expected: true
	},
	{
		input: 'datadog',
		expected: false
	},
	{
		input: 'const = DATADOG_ACCESS_TOKEN',
		expected: false
	},
	{
		input: 'DATADOG',
		expected: false
	}
]

datadog.testcases = testcase