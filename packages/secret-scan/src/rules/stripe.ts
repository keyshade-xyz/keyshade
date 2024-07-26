// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function stripe(): RegExp[] {
  return [/(?:r|s)k_live_[0-9a-zA-Z]{24}/]
}

const testcase: TestCase[] = [
  {
    input: 'sk_live_ReTllpYQYfIZu2Jnf2lAPFjD',
    expected: true
  },
  {
    input: 'rk_live_5TcWfjKmJgpql9hjpRnwRXbT',
    expected: true
  },
  {
    input: 'const abrakadabra = rk_live_5TcWfjKmJgpql9hjpRnwRXbT',
    expected: true
  },
  {
    input: 'pk_live_j5krY8XTgIcDaHDb3YrsAfCl',
    expected: false
  },
  {
    input: 'sk_live_',
    expected: false
  },
  {
    input: 'rajdip',
    expected: false
  }
]

stripe.testcases = testcase
