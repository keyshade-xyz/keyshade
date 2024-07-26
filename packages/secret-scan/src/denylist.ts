import { SecretConfig } from './index'
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

const denylist: SecretConfig = {
  private_key: private_key(),

  openAI: openAI(),

  pypi: pipy(),

  sendgrid: sendgrid(),

  square_OAuth: square_OAuth(),

  stripe: stripe(),

  telegram_token: telegram_token(),

  twilo: twilo(),

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

  alibaba: alibaba()
}

export default denylist
