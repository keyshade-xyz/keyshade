// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function aws(): RegExp[] {
  return [/(?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}/]
}

const testcase: TestCase[] = [
  {
    input: 'AKIALALEMEL33243OLIB',
    expected: true
  },
  {
    input: 'AKIAZZZZZZZZZZZZZZZZ',
    expected: true
  },
  {
    input: 'akiazzzzzzzzzzzzzzzz',
    expected: false
  },
  {
    input: 'AKIAZZZ',
    expected: false
  },
  {
    input: 'A3T0ZZZZZZZZZZZZZZZZ',
    expected: true
  },
  {
    input: 'ABIAZZZZZZZZZZZZZZZZ',
    expected: true
  },
  {
    input: 'ACCAZZZZZZZZZZZZZZZZ',
    expected: true
  },
  {
    input: 'ASIAZZZZZZZZZZZZZZZZ',
    expected: true
  }
]

aws.testcases = testcase
