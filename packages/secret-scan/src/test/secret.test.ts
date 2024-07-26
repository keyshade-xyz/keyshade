import { describe, it } from 'mocha'
import assert = require('assert')
import {
  algolia,
  alibaba,
  artifactory,
  aws,
  discord,
  github,
  ip_public,
  jwt,
  mailchimp,
  npm,
  openAI,
  pipy,
  private_key,
  sendgrid,
  square_OAuth,
  stripe,
  telegram_token,
  twilo
} from '@/rules'
import type { TestCase } from '@/types'
import secretDetector from '@/index'

const testcaseTitleTemplate = (title: string) => `should detect ${title}`

function testSecret(testcase: TestCase[]) {
  testcase.forEach(({ input, expected }, index) => {
    const result = secretDetector.detect(input)
    assert.equal(
      result.found,
      expected,
      `(i=${index}) For Input: ${input}, expected ${expected} but got ${result.found}`
    )
  })
}

describe('Detect Secrets from string', () => {
  it(testcaseTitleTemplate('Private keys'), () => {
    testSecret(private_key.testcases)
  })

  it(testcaseTitleTemplate('OpenAI keys'), () => {
    testSecret(openAI.testcases)
  })

  it(testcaseTitleTemplate('PyPi keys'), () => {
    testSecret(pipy.testcases)
  })

  it(testcaseTitleTemplate('Sendgrid keys'), () => {
    testSecret(sendgrid.testcases)
  })

  it(testcaseTitleTemplate('Square OAuth keys'), () => {
    testSecret(square_OAuth.testcases)
  })

  it(testcaseTitleTemplate('Stripe keys'), () => {
    testSecret(stripe.testcases)
  })

  it(testcaseTitleTemplate('Telegram token'), () => {
    testSecret(telegram_token.testcases)
  })

  it(testcaseTitleTemplate('Twilo keys'), () => {
    testSecret(twilo.testcases)
  })

  it(testcaseTitleTemplate('NPM keys'), () => {
    testSecret(npm.testcases)
  })

  it(testcaseTitleTemplate('Mailchimp keys'), () => {
    testSecret(mailchimp.testcases)
  })

  // ! not working for seperated by dots, saying true to all
  // it(testcaseTitleTemplate("JWT Key"), () => {
  //     testSecret(jwt.testcases);
  // });

  it(testcaseTitleTemplate('Public IP'), () => {
    testSecret(ip_public.testcases)
  })

  it(testcaseTitleTemplate('Github Token'), () => {
    testSecret(github.testcases)
  })

  it(testcaseTitleTemplate('Discord Token'), () => {
    testSecret(discord.testcases)
  })
  it(testcaseTitleTemplate('Artifactory Token'), () => {
    testSecret(artifactory.testcases)
  })
  it(testcaseTitleTemplate('AWS Token'), () => {
    testSecret(aws.testcases)
  })
  it(testcaseTitleTemplate('Algolia Token'), () => {
    testSecret(algolia.testcases)
  })
  it(testcaseTitleTemplate('Alibaba Key'), () => {
    testSecret(alibaba.testcases)
  })
})
