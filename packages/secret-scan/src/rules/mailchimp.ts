// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function mailchimp(): RegExp[] {
  return [/[0-9a-z]{32}-us[0-9]{1,2}/]
}

const testcase: TestCase[] = [
  {
    input: '343ea45721923ed956e2b38c31db76aa-us30',
    expected: true
  },
  {
    input: 'a2937653ed38c31a43ea46e2b19257db-us2',
    expected: true
  },
  {
    input: '3ea4572956e2b381923ed34c31db76aa-2',
    expected: false
  },
  {
    input: 'aea462953eb192d38c31a433e76257db-al32',
    expected: false
  },
  {
    input: '9276a43e2951aa46e2b1c33ED38357DB-us2',
    expected: false
  },
  {
    input: '3a5633e829d3c71-us2',
    expected: false
  }
]

mailchimp.testcases = testcase
