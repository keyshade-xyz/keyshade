// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function readme(): RegExp[] {
  return [
    // Readme API Key regex
    /rdme_[a-z0-9]{70}/
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'rdme_gmof25sb3fpcxljii5qvo1bqm7bartk9plo3r1yzus98rp1r7m6ljbn6wca140bra0luib',
    expected: true
  },
  {
    input:
      'rdme_5the1frp29hldpuswj1qxczbk5w2m5hxza48zwi3mvppjr9w4fjqzed74znqvd2sku3c3h',
    expected: true
  },
  {
    input: 'rdme_',
    expected: false
  },
  {
    input: 'README',
    expected: false
  }
]

readme.testcases = testcase
