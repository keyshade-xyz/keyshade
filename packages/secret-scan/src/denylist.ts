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
  twilio, dropbox, duffel, dynatrace,
  easypost,
  facebook,
  flutterwave,
  frameio,
  gitlab,
  grafana,
  harness,
  hashicorp,
  heroku,
  hubspot,
  huggingface,
  infracost,
  intra42,
  // kubernetes,
  linear, lob, planetscale, postman, prefect, pulumi, readme, rubygems, scalingo, sendinblue, shippo
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

  duffel: duffel(),

  dynatrace: dynatrace(),

  easypost: easypost(),

  facebook: facebook(),

  flutterwave: flutterwave(),

  frameio: frameio(),

  gitlab: gitlab(),

  grafana: grafana(),

  harness: harness(),

  hashicorp: hashicorp(),

  heroku: heroku(),

  hubspot: hubspot(),

  huggingface: huggingface(),

  infracost: infracost(),

  intra42: intra42(),

  //kubernetes: kubernetes(),

  linear: linear(),

  lob: lob(),

  planetscale: planetscale(),

  postman: postman(),

  prefect: prefect(),

  pulumi: pulumi(),

  readme: readme(),

  rubygems: rubygems(),

  scalingo: scalingo(),

  sendinblue: sendinblue(),

  shippo: shippo()
}

export default denylist
