// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function sidekiq(): RegExp[] {
  return [
    // Sidekiq Secret regex
    /BUNDLE_ENTERPRISE__CONTRIBSYS__COM|BUNDLE_GEMS__CONTRIBSYS__COM( = |=)[^\n]*[a-f0-9]{8}:[a-f0-9]{8}/,

    // Sidekiq Sensitive URL Regex
    /\bhttps?:\/\/([a-f0-9]{8}:[a-f0-9]{8})@(gems\.contribsys\.com|enterprise\.contribsys\.com)(?:[\/|#|?|:]|$)/i
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'BUNDLE_GEMS__CONTRIBSYS__COM=UBrkb/_"6,a,:,xH:}L02N[LFDkqM9+rLk.q~X%+\'zZP>vku<0eaYlV9Uj+YGh]; y%fiMj9j0ba92c069:de1f9899',
    expected: true
  },
  {
    input: 'BUNDLE_ENTERPRISE__CONTRIBSYS__COM',
    expected: true
  },
  {
    input: 'http://f85e09bd:a0fd7dff@enterprise.contribsys.com/',
    expected: true
  },
  {
    input: 'http://70310b59:ad696f7f@gems.contribsys.com',
    expected: true
  }
]

sidekiq.testcases = testcase
