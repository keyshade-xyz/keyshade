// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function definednetworking(): RegExp[] {
  return [
    // Defined Networking API Token Regex
    /dnkey-[a-z0-9=_-]{26}-[a-z0-9=_-]{52}/i
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'dnkey-u8zyff1jig=vnqorg=r=kn3vfj-6u0c8vass=ck8dji9a_r3=d-1rcza8cmawt4f2ivy6g58sgjysa-',
    expected: true
  },
  {
    input:
      'dnkey-i9tayj=cb6x0cn83j2pk6lat90-1egyi2mlqafyoz2np5ca7vqnalyctifus=db1_z-4qrofld59zjr',
    expected: true
  },
  {
    input:
      'dnkey-15-0_=jfg5h3ll1p490qd=v6-k-3o=nqllwjm802109x_x23-rd0l5e8ta57ivz1j6-9_74gvj7ob-d',
    expected: true
  },
  {
    input: 'defined',
    expected: false
  },
  {
    input: 'const = DEFINED_NETWORKING_API_TOKEN',
    expected: false
  },
  {
    input: 'networking',
    expected: false
  },
  {
    input: 'dnkey-',
    expected: false
  }
]

definednetworking.testcases = testcase
