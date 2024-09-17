// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function grafana(): RegExp[] {
	return [
		/eyJrIjoi[A-Za-z0-9]{70,400}={0,2}/,  		   // Grafana API Key regex
		/glc_[A-Za-z0-9+/]{32,400}={0,2}/,           // Grafana Cloud API Token regex
		/glsa_[A-Za-z0-9]{32}_[A-Fa-f0-9]{8}/        // Grafana Service Account Token regex
	]
}

const testcase: TestCase[] = [
	{
		input: 'eyJrIjoiLC58NHoAWV9QQ4Hpinsjz28MsjlfclKhSP6J6ecvqe7mHV67gknZlPfS92wlJSaGVwKI8ZOxmosmWlylfjEQwsDL9M31sNtgLyJZgXMKr3YXFUvwXrxrUmrmA3SGEDQeqrwuQKIRglOx94NHGe7wve0xbOf3Mkysv6u8LUB9H2ZJJhtPorLByR2rUMaZaauZvyNm6dkz4iYgxNk2ROP6PIA1E6N6TGwHa44pebzqMSDMPSlVAWrNaK2xjco3Ez7qtXpJl7tayylHAONDcWiM9vQDUELUA8uZtQsHNZP4DEoPMKHeaChAMlAVzDvzaM8fkGta9CJeqfrwb4qJ2Y6uwsXk8e8XMsSWPsxXFyOe7NUVMPNFzy8C344xiv3YcvV1E==',
		expected: true
	},
	{
		input: 'eyJrIjoiIvuuuE2MzK2VJR23kHp3Q90IJSdnW9f1WIoyculWhTLBXrykooBhgIYm6IJgCndcSWDIaXJks7bkCdP3ywa7AfVpQP9rmJOq5VK57mas1KcdXD7Z1bdvhSo0mdzW91epWEcnlnLQpbtVLlDvxqnak9WETmFH==',
		expected: true
	},
	{
		input: 'eyJrIjoi6QlsUNL4JJHbBXlyJS3SiRDPUzUfhT1B2w6px62kuQK05cTohhVE4TR2H9dOGNF5B6plJAECmpGfWca7gbA7LpFGRRVG',
		expected: true
	},
	{
		input: 'glc_kB8ZcmLO+X1zpBZ7ljeXs8x8QjAPWLAQfIMv9r+4iOeAnQXnecZLzdPkutte3w0u737mBAFf+v3CitNm0fzUOEFd26tuVsncFpEkxRq/kjcYEhBWLYtIStMLcYyo7XhyLFW8IM7Bf4tGI9g5n9jfjtZnWqfKWEEhaHfE0ra',
		expected: true
	},
	{
		input: 'glc_Hb574KjK4N0Z81xqlZGJy0IZCvBmDPT7cPPVqdH9plY1GbHRVl8Nm8coHWlRrh97YJTUyaNSF1Ec3r36sOHyks9C31FIX5vEpAvRx5ZReGdPV4DVP9Y33gzhMgqhHA4HEUi+hnFPClhPlXMBMhZJLUAzFvP0AoOMxrkXnCMJSwfPC4/9/djzC16zX9MuYFWf==',
		expected: true
	},
	{
		input: 'glc_zSP9RW2kk4DZpq/gXYZwiKmLudxJqUNfXjtC8BvJLiMS32766GkZNOq2XIvPs8ZfFAh3yMUYTs/N4UT2d7q63uqq7=',
		expected: true
	},
	{
		input: 'glsa_phY2htSd5uTt3jmPvK8XBLuq1hwk8K7J_BbB124A7',
		expected: true
	},
	{
		input: 'glsa_8LVjQdfLZyFiylzBXDmwAhkwkHODsRNJ_B6BfAf1c',
		expected: true
	},
	{
		input: 'glsa_OBtXDlTAprnRnhZPLHXPyFeY9lbXc4dW_Eb1A4125',
		expected: true
	},
	{
		input: 'glsa_OBtXDlTAprnRnhZPLHXPyFeY9lbXc4dW_',
		expected: false
	},
	{
		input: 'glc_zSP9RW2kq/gXYZwiKmLudxJqU66GkZN',
		expected: false
	},
	{
		input: 'eyJrIjoi6QlsUNL4JJHbBXlyJS3SiRDPUzUfhT1B2w6px62kuQK05cTohhVE4TR2H9dO',
		expected: false
	},
	{
		input: 'GRAFANA',
		expected: false
	},
	{
		input: 'const = GRAFANA_API_KEY',
		expected: false
	},
	{
		input: 'GRAFANA_API_KEY',
		expected: false
	},
	{
		input: 'GRAFANA_CLOUD_API_TOKEN',
		expected: false
	},
	{
		input: 'GRAFANA_SERVICE_ACCOUNT_TOKEN',
		expected: false
	}
]

grafana.testcases = testcase