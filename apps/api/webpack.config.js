const { composePlugins, withNx } = require('@nx/webpack')
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin')

module.exports = composePlugins(
  withNx({
    target: 'node',
    devtool: 'source-map',
    plugins: [
      ...(process.env.SENTRY_ENV === 'production' ||
      process.env.SENTRY_ENV === 'stage'
        ? [
            sentryWebpackPlugin({
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              authToken: process.env.SENTRY_AUTH_TOKEN
            })
          ]
        : [])
    ]
  }),
  (config) => {
    return config
  }
)
