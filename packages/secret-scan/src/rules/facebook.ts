// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function facebook(): RegExp[] {
	return [
		/\d{15,16}([|%])[0-9a-z\-_]{27,40}/i,  		// Facebook Access Token regex
		/EAA[MC][a-z0-9]{20,}/i       // Facebook Page Access Token regex
	]
}

const testcase: TestCase[] = [
	{
		input: '5219701998240756|trfnpbd-f85yzmsbfv1w1yfqybo_d',
		expected: true
	},
	{
		input: '5787803457532702|snysgapvyoyn-_634d8swk1mla_',
		expected: true
	},
	{
		input: '477694365976971%5t3cb9379539yjkz92pcllkpk8seopx8lw',
		expected: true
	},
	{
		input: 'EAAM4qg58c5n0r3xy1as780uebhdl5mkild7w9iyxvs3cvl',
		expected: true
	},
	{
		input: 'EAAMqzici842ogge7tlds11embpqnu8n6ue1v7k858jbqnfb7r2jih7m80wfz94knzdyplt33p20mt3wukadu4l4ayj0ctmkovq5nt3w2h1',
		expected: true
	},
	{
		input: 'EEAAMfrnibgnp6vhh9hkqwcdzpbrgnjn8m14laqn3mns9ee7786kdcbr9saenj8fmi7dboe907r5ooh997zln3h68hxrl2w8z0soiybzi',
		expected: true
	},
	{
		input: 'const = FACEBOOK_API_TOKEN',
		expected: false
	},
	{
		input: 'EAAM4qg58c5n0r3xy1',
		expected: false
	},
	{
		input: '477694365976971%5t3c',
		expected: false
	}
]

facebook.testcases = testcase