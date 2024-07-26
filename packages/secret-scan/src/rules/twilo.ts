// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function twilo(): RegExp[] {
  return [
    // Account SID (ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
    /AC[a-z0-9]{32}/,
    // Auth token (SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
    /SK[a-z0-9]{32}/
  ]
}

const testcase: TestCase[] = [
  {
    input: 'ACo7f03e3uy5vfcc17ncb64k7rtg7gtch5',
    expected: true
  },
  {
    input: 'SKd99e80rhvm1vp1aqv4ulkztmta4brt9j',
    expected: true
  },
  {
    input: 'AChjxh19jyontpubr184o439vky8jpbsv9',
    expected: true
  },
  {
    input: 'SKkb4wse475c43u6noawtwelz60hlffylj',
    expected: true
  },
  {
    input: 'ABCdesftvhoekjvnoe',
    expected: false
  }
]

twilo.testcases = testcase
