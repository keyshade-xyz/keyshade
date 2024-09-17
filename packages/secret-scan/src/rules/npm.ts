// keyshade-ignore-all
import type { TestCase } from '@/types'

/**
 * npmrc authToken
 * ref. https://stackoverflow.com/questions/53099434/using-auth-tokens-in-npmrc
 */
export default function npm(): RegExp[] {
  return [/\/\/.+\/:_authToken=\s*((npm_.+)|([A-Fa-f0-9-]{36})).*/]
}
const testcase: TestCase[] = [
  {
    input:
      '//registry.npmjs.org/:_authToken=743b294a-cd03-11ec-9d64-0242ac120002',
    expected: true
  },
  {
    input:
      '//registry.npmjs.org/:_authToken=346a14f2-a672-4668-a892-956a462ab56e',
    expected: true
  },
  {
    input:
      '//registry.npmjs.org/:_authToken= 743b294a-cd03-11ec-9d64-0242ac120002',
    expected: true
  },
  {
    input: '//registry.npmjs.org/:_authToken=npm_xxxxxxxxxxx',
    expected: true
  },
  {
    input:
      '//registry.npmjs.org:_authToken=743b294a-cd03-11ec-9d64-0242ac120002',
    expected: true
  },
  {
    input:
      'registry.npmjs.org/:_authToken=743b294a-cd03-11ec-9d64-0242ac120002',
    expected: true
  },
  {
    input: '///:_authToken=743b294a-cd03-11ec-9d64-0242ac120002',
    expected: true
  },
  {
    input: '_authToken=743b294a-cd03-11ec-9d64-0242ac120002',
    expected: true
  },
  {
    // eslint-disable-next-line no-template-curly-in-string
    input: '//registry.npmjs.org/:_authToken=${NPM_TOKEN}',
    expected: false
  },
  {
    input: '//registry.npmjs.org/:_authToken=',
    expected: false
  },
  {
    // eslint-disable-next-line no-template-curly-in-string
    input: '//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}',
    expected: false
  }
]

npm.testcases = testcase
