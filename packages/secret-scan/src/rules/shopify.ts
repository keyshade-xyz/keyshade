// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function shopify(): RegExp[] {
	return [
		// Shopify Shared Secret regex
		/shpss_[a-fA-F0-9]{32}/,

		// Shopify Access Token Regex
		/shpat_[a-fA-F0-9]{32}/,

		// Shopify Custom Access Token Regex
		/shpca_[a-fA-F0-9]{32}/,

		// Shopify Private App Access Token
		/shppa_[a-fA-F0-9]{32}/
	]
}

const testcase: TestCase[] = [
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	},
	{
		input: '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',
		expected: true
	}
]

shopify.testcases = testcase