// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function confluent(): RegExp[] {
  return [
    /confluent[a-zA-Z0-9]{64}/i, //Confluent Secret Key regex
    /confluent[a-zA-Z0-9]{16}/i //Confluent Access Key Regex
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'confluent3G5qsTebXxFLB1Kht4ryL1bAwuY5G8R3OPCFEkNfuMLCyNSoiCPvkZYsCVofnoT1',
    expected: true
  },
  {
    input:
      'confluentEjbQrUmCVHUJxkCT8ZvxPGbISq4KFfebycri6grc3XXGnzNGPHSKbAnaXdgxAT3N',
    expected: true
  },
  {
    input:
      'confluentef4FsV7WaAenQtGxvbx5hVCcpkOIRA3Ug5r3QjLPMrPjgGdqMhyMTt4PuybQYXuP',
    expected: true
  },
  {
    input: 'confluentbz9upnD4TwQsTr0m',
    expected: true
  },
  {
    input: 'confluentHjavJvHRIUTOoPcn',
    expected: true
  },
  {
    input: 'confluentdJXRT8BKWWCdjuTa',
    expected: true
  },
  {
    input:
      'confluent234287*3___-347w83437@44^^2443HSYGTRHUsjfye3728rkejtye73bpsnfu3892muyy2bsuy8y34u58634',
    expected: false
  },
  {
    input: 'const = CONFLUENT_SECRET_KEY',
    expected: false
  },
  {
    input: 'const = CONFLUENT_ACCESS_TOKEN',
    expected: false
  },
  {
    input: 'confluent',
    expected: false
  }
]

confluent.testcases = testcase
