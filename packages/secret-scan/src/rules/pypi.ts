// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function pypi(): RegExp[] {
  return [
    // ref. https://warehouse.pypa.io/development/token-scanning.html
    // pypi.org token
    /pypi-AgEIcHlwaS5vcmc[A-Za-z0-9-_]{70,}/,

    // test.pypi.org token
    /pypi-AgENdGVzdC5weXBpLm9yZw[A-Za-z0-9-_]{70,}/
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'pypi-AgEIcHlwaS5vcmcCJDU3OTM1MjliLWIyYTYtNDEwOC05NzRkLTM0MjNiNmEwNWIzYgACF1sxLFsitesttestbWluaW1hbC1wcm9qZWN0Il1dAAIsWzIsWyJjYWY4OTAwZi0xNDMwLTRiYQstYmFmMi1mMDE3OGIyNWZhNTkiXV0AAAYgh2UINPjWBDwT0r3tQ1o5oZyswcjN0-IluP6z34SX3KM',
    expected: true
  },
  {
    input:
      'pypi-AgENdGVzdC5weXBpLm9yZwIkN2YxOWZhOWEtY2FjYS00MGZhLTj2MGEtODFjMnE2MjdmMzY0AAIqWzMsImJlM2FiOWI5LTRmYUTnNEg4ZS04Mjk0LWFlY2Y2NWYzNGYzNyJdAAAGIMb5Hb8nVvhcAizcVVzA-bKKnwN7Pe0RmgPRCvrPwyJf',
    expected: true
  },
  {
    input:
      'const Key=pypi-AgENdGVzdC5weXBpLm9yZwIkN2YxOWZhOWEtY2FjYS00MGZhLTj2MGEtODFjMnE2MjdmMzY0AAIqWzMsImJlM2FiOWI5LTRmYUTnNEg4ZS04Mjk0LWFlY2Y2NWYzNGYzNyJdAAAGIMb5Hb8nVvhcAizcVVzA-bKKnwN7Pe0RmgPRCvrPwyJf',
    expected: true
  },
  {
    input:
      'pypi-AgEIcHlwaS5vcmcCJDU3OTM1MjliLWIyYTYtNDEwOC05NzRkLTM0MjNiNmEwNWIzYgACF1sxLFsibWluaW1h',
    expected: false
  }
]

pypi.testcases = testcase
