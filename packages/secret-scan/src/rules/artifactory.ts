// keyshade-ignore-all
import type { TestCase } from '@/types'

export default function artifactory(): RegExp[] {
  return [
    // Artifactory tokens begin with AKC
    /(?:\s|=|:|"|^)AKC[a-zA-Z0-9]{10,}(?:\s|"|$)/, // API token

    // Artifactory encrypted passwords begin with AP[A-Z]
    /(?:\s|=|:|"|^)AP[\dABCDEF][a-zA-Z0-9]{8,}(?:\s|"|$)/ // Password
  ]
}

const testcase: TestCase[] = [
  { input: 'AP6xxxxxxxxxx', expected: true },
  { input: 'AP2xxxxxxxxxx', expected: true },
  { input: 'AP3xxxxxxxxxx', expected: true },
  { input: 'AP5xxxxxxxxxx', expected: true },
  { input: 'APAxxxxxxxxxx', expected: true },
  { input: 'APBxxxxxxxxxx', expected: true },
  { input: 'AKCxxxxxxxxxx', expected: true },
  { input: ' AP6xxxxxxxxxx', expected: true },
  { input: ' AKCxxxxxxxxxx', expected: true },
  { input: '=AP6xxxxxxxxxx', expected: true },
  { input: '=AKCxxxxxxxxxx', expected: true },
  { input: '"AP6xxxxxxxxxx"', expected: true },
  { input: '"AKCxxxxxxxxxx"', expected: true },
  { input: 'artif-key:AP6xxxxxxxxxx', expected: true },
  { input: 'artif-key:AKCxxxxxxxxxx', expected: true },
  { input: 'X-JFrog-Art-Api: AKCxxxxxxxxxx', expected: true },
  { input: 'X-JFrog-Art-Api: AP6xxxxxxxxxx', expected: true },
  { input: 'artifactoryx:_password=AKCxxxxxxxxxx', expected: true },
  { input: 'artifactoryx:_password=AP6xxxxxxxxxx', expected: true },
  { input: 'testAKCwithinsomeirrelevantstring', expected: false },
  { input: 'testAP6withinsomeirrelevantstring', expected: false },
  { input: 'X-JFrog-Art-Api: $API_KEY', expected: false },
  { input: 'X-JFrog-Art-Api: $PASSWORD', expected: false },
  { input: 'artifactory:_password=AP6xxxxxx', expected: false },
  { input: 'artifactory:_password=AKCxxxxxxxx', expected: false }
]

artifactory.testcases = testcase
