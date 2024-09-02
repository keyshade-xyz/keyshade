import { SecretConfig } from './index'
import {
  adafruit,
  adobe,
  age,
  airtable,
  algolia,
  alibaba,
  artifactory,
  aws,
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
  databricks,
  discord,
  datadog,
  definednetworking,
  digitalocean,
  doppler,
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
  twilio, dropbox, duffel
} from '@/rules'

const denylist: SecretConfig = {
  private_key: private_key(),

  openAI: openAI(),

  pypi: pypi(),

  sendgrid: sendgrid(),

  square_OAuth: square_OAuth(),

  stripe: stripe(),

  telegram_token: telegram_token(),

  twilio: twilio(),

  npm: npm(),

  mailchimp: mailchimp(),

  // ! This regex is not perfect, but it should catch most of the cases
  jwt: jwt(),

  ip_public: ip_public(),

  github: github(),

  discord: discord(),

  artifactory: artifactory(),

  aws: aws(),

  algolia: algolia(),

  alibaba: alibaba(),

  adafruit: adafruit(),

  adobe: adobe(),

  age: age(),

  airtable: airtable(),

  asana: asana(),

  atlassian: atlassian(),

  authress: authress(),

  beamer: beamer(),

  bitbucket: bitbucket(),

  bittrex: bittrex(),

  clojars: clojars(),

  //cloudflare: cloudflare(),  // This regex is breaking other regexes, TODO: Fix this

  codecov: codecov(),

  coinbase: coinbase(),

  confluent: confluent(),

  contentful: contentful(),

  databricks: databricks(),

  datadog: datadog(),

  definednetworking: definednetworking(),

  digitalocean: digitalocean(),

  doppler: doppler(),

  dropbox: dropbox(),

  duffel: duffel()
}

export default denylist
