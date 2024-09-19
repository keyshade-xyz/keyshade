// keyshade-ignore-all
import type { TestCase }from '@/types'

export default function hashicorp(): RegExp[] {
	return [
		// Hashicorp Terraform APi Token Regex
		/[a-z0-9]{14}\.atlasv1\.[a-z0-9\-_=]{60,70}/i
	]
}

const testcase: TestCase[] = [
	{
		input: '9mc0jh5dvgc1cx.atlasv1.y4u=-3=j=5nbf2bg0tkg1019e_9r6ghkmugdfl05hp2qzdd8=8d=wmtfya99o',
		expected: true
	},
	{
		input: 't4eyvzkop56q4o.atlasv1.idknou9rz9ul3y2lepjhk=c6dvpdioedep=cwkrzk4m8i5v8fpb-kixusz-xo7loooj1',
		expected: true
	},
	{
		input: 'TERRAFORM',
		expected: false
	}
]

hashicorp.testcases = testcase