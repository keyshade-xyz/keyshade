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
  pypi,
  private_key,
  sendgrid,
  square_OAuth,
  stripe,
  telegram_token,
  twilio,
  adafruit,
  adobe,
  age,
  airtable,
  asana,
  atlassian,
  authress,
  beamer,
  bitbucket,
  bittrex,
  clojars,
  cloudflare,
  codecov,
  coinbase,
  confluent,
  contentful,
  databricks
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
    testSecret(pypi.testcases)
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

  it(testcaseTitleTemplate('Twilio keys'), () => {
    testSecret(twilio.testcases)
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
  it(testcaseTitleTemplate('Adafruit Key'), () => {
    testSecret(adafruit.testcases)
  })
  it(testcaseTitleTemplate('Adobe Key'), () => {
    testSecret(adobe.testcases)
  });
  it(testcaseTitleTemplate('Age Key'), () => {
    testSecret(age.testcases)
  });
  it(testcaseTitleTemplate('Airtable Key'), () => {
    testSecret(airtable.testcases)
  });
  it(testcaseTitleTemplate('Asana Key'), () => {
    testSecret(asana.testcases)
  });
  it(testcaseTitleTemplate('Atlassian Key'), () => {
    testSecret(atlassian.testcases)
  });
  it(testcaseTitleTemplate('Authress Key'), () => {
    testSecret(authress.testcases)
  });
  it(testcaseTitleTemplate('Beamer Key'), () => {
    testSecret(beamer.testcases)
  });
  it(testcaseTitleTemplate('Bitbucket Key'), () => {
    testSecret(bitbucket.testcases)
  });
  it(testcaseTitleTemplate('Bittrex Key'), () => {
    testSecret(bittrex.testcases)
  });
  it(testcaseTitleTemplate('Clojars Key'), () => {
    testSecret(clojars.testcases)
  });

  /* TODO: Fix the cloudflare testcase and regex, it's breaking OpenAI, Pypi, Sendgrid, NPM, GitHub, Beamer, Bittrex,
      Clojars, Cloudflare tests
      path: ./packages/secret-scan/src/rules/cloudflare.ts
  it(testcaseTitleTemplate('Cloudflare Key'), () => {
    testSecret(cloudflare.testcases)
  });*/

  it(testcaseTitleTemplate('Codecov Key'), () => {
    testSecret(codecov.testcases)
  });
  it(testcaseTitleTemplate('Coinbase Key'), () => {
    testSecret(coinbase.testcases)
  });
  it(testcaseTitleTemplate('Confluent Key'), () => {
    testSecret(confluent.testcases)
  });
  it(testcaseTitleTemplate('Contentful Key'), () => {
    testSecret(contentful.testcases)
  });
  it(testcaseTitleTemplate('Databricks Key'), () => {
    testSecret(databricks.testcases)
  });
})
