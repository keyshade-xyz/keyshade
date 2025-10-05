// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function github(): RegExp[] {
  return [
    /^(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36}$/,
    /^github_pat_[0-9a-zA-Z_]{82}$/
  ]
}

const testcase: TestCase[] = [
  {
    input: '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',
    expected: true
  },
  {
    input: 'foo_wWPw5k4aXcaT4fNP0UcnZwJUVFk6LO0pINUx',
    expected: false
  },
  { input: 'foo', expected: false }
]

github.testcases = testcase
