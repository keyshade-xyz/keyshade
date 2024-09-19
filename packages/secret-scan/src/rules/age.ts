// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function age(): RegExp[] {
  return [
    // Age API key regex
    /AGE-SECRET-KEY-1[QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L]{58}/
  ]
}

const testcase: TestCase[] = [
  {
    input: 'AGE-SECRET-KEY-17TWAXMPDQAJV0RH43E5FJH5F0LUTFR3JTCM999XEF70QA57SZGXFJ3NQZK',
    expected: true
  },
  {
    input: 'AGE-SECRET-KEY-1QZRY9X8GF2TVDW0S3JN54KHCE6MUA7L1QZRY9X8GF2TVDW0S3JN54KHCE6MUA7L1QZRY9X8GF2TVDW0S3JN54KHCE6MUA7L',
    expected: false
  },
  {
    input: 'AGE-SECRET-KEY-1QZRY9X8GF2TVDW0S3JN54KHCE6MUA7L',
    expected: false
  },
  {
    input: "AGE-SECRET-KEY",
    expected: false
  },
  {
    input: "AGE",
    expected: false
  }
]

age.testcases = testcase