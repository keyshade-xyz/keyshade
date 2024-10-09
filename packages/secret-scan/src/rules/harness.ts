// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function harness(): RegExp[] {
  return [
    // Harness Personal Access (starts with `pat`) & Service Account (starts with `sat`) Token regex
    /(?:pat|sat)\.[a-zA-Z0-9]{22}\.[a-zA-Z0-9]{24}\.[a-zA-Z0-9]{20}/
  ]
}

const testcase: TestCase[] = [
  {
    input:
      'sat.tbD3t0UTVxnDsJjXtA7yFg.Ses0cii322QyNVAWsGCAtbPG.cL64ShIGlxlB55eB2YSw',
    expected: true
  },
  {
    input:
      'sat.D5rQDqdpmAy8RCFrGOjBXu.8YSoWK1thmC6eTbWDLSg4SiK.OnKZVW9IytuKh9HFhhKG',
    expected: true
  },
  {
    input:
      'pat.GRDSyUuWR5EA2jwP2LDXEv.WqO2w3p1vb8QBvif7r0ilHTS.8T9HF4wdkNw1SxJTcoB3',
    expected: true
  },
  {
    input:
      'pat.t9KDTZ3Z4y1LZx2lwLTx5Y.VHA8Fd6wMD8Lc5yZ1aruadYC.v56fG64UhjmwgkoY5ugl\n',
    expected: true
  },
  {
    input: 'const = HARNESS_PERSONAL_ACCESS_TOKEN',
    expected: false
  },
  {
    input: 'const = HARNESS_SERVICE_ACCOUNT_TOKEN',
    expected: false
  },
  {
    input: 'HARNESS',
    expected: false
  },
  {
    input: 'pat.',
    expected: false
  },
  {
    input: 'sat.',
    expected: false
  }
]

harness.testcases = testcase
