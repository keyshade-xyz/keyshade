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
  twilio
} from '@/rules'

const denylist: SecretConfig = {
  private_key: private_key(),

  openAI: openAI(),

  pypi: pipy(),

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

  beamer: beamer()
}

export default denylist
