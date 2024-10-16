// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function huggingface(): RegExp[] {
  return [
    // Huggingface Access Token regex
    /(?:^|[\\'"` + "`" + ` >=:])(hf_[a-zA-Z]{34})(?:$|[\\'"` + "`" + ` <])/,

    // Huggingface Organization Access Token Regex
    /(?:^|[\\'"` + "`" + ` >=:\(,)])(api_org_[a-zA-Z]{34})(?:$|[\\'"` + "`" + ` <\),])/
  ]
}

const testcase: TestCase[] = [
  {
    input: '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',
    expected: true
  },
  {
    input: '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',
    expected: true
  },
  {
    input: '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',
    expected: true
  },
  {
    input: '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',
    expected: true
  },
  {
    input: 'api_org_',
    expected: false
  },
  {
    input: 'hf_',
    expected: false
  }
]

huggingface.testcases = testcase
