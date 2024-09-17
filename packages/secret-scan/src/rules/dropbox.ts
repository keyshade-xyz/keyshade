// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function dropbox(): RegExp[] {
	return [
	//	/[a-zA-Z0-9]{15}/i,  		                        // Dropbox API Secret   TODO: This regex is too generic
		/sl\.[a-z0-9\-=_]{135}/i,		                    // Dropbox Short Lived API Secret
		/[a-z0-9]{11}AAAAAAAAAA[a-z0-9\-_=]{43}/i       // Dropbox Long Lived API Secret
	]
}

const testcase: TestCase[] = [
	// {
	// 	input: 'v3tpJLAgvfvDuOR',
	// 	expected: true
	// },
	{
		input: 'sl.idap1pjlvrg-_heuxm8x-_nq8pot9nu3a_b_0gfdh7b=cio8wirw0lu0wlx56zrct7f60ga6v=a__khqvv6yw_hgvzem9fdotvrw874cini4dt34pp3l5kpwvo1g4drefjowpoj',
		expected: true
	},
	{
		input: 'nn63as3wdinAAAAAAAAAAlfs_frv4=tzjxss-x3xfjj4-q_bez2idi2tgye2uh_m',
		expected: true
	},
	{
		input: 'DROPBOX',
		expected: false
	},
	{
		input: 'const = DROPBOX_TOKEN',
		expected: false
	},
	{
		input: 'drOP',
		expected: false
	},
	{
		input: 'dHGSDasw',
		expected: false
	}
]

dropbox.testcases = testcase