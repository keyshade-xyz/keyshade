// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function beamer(): RegExp[] {
  return [
    // Beamer API key regex
    /b_[a-z0-9=_-]{44}/i
  ]
}

const testcase: TestCase[] = [
  {
    input: 'b_m8lv5nnp021yblkx7y_1vbcb2anqlsh_rkn4i2chhl0r',
    expected: true
  },
  {
    input: 'b_u9b1=i7pmk7w7_hsqkj_tse4k8y260x34709dipjp9tt',
    expected: true
  },
  {
    input: 'b_0pm01o0ypb0p76uul9w07q8zzae-6iytk3p4kejlsxza',
    expected: true
  },
  {
    input: 'beamer_0pm01o0ypb0p76uul9w07q8zzae-6iytk3p4kejlsxza',
    expected: false
  },
  {
    input: 'beamereerrrereerrrrere',
    expected: false
  },
  {
    input: 'b_',
    expected: false
  }
]

beamer.testcases = testcase
