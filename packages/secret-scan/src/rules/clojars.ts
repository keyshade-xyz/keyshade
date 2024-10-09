// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function clojars(): RegExp[] {
  return [
    // Clojars key regex
    /CLOJARS_[a-z0-9]{60}/i
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'CLOJARS_j6qt9h47zes979orwhr7fk8fhm1wdwwkefd1lm1tf0z8tly3l434quseqq7r',
    expected: true
  },
  {
    input:
      'CLOJARS_e0t9cba83kvg9fh1toqt5euuppqh6lz4dsk3xocd00vc2n58q400ez34uuzr',
    expected: true
  },
  {
    input:
      'CLOJARS_juyzrsdpxlmiqwsjemyudcdh63dll3wlluatf51zeb6s8oj7y9uhnkive91j',
    expected: true
  },
  {
    input: 'closure27bdubysrbf348yb23-sbdufbsj8983rhy',
    expected: false
  },
  {
    input: 'clojars',
    expected: false
  },
  {
    input: 'closure',
    expected: false
  }
]

clojars.testcases = testcase
