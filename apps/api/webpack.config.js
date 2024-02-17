const { composePlugins, withNx } = require('@nx/webpack')
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin')

module.exports = composePlugins(
  withNx({
    target: 'node',
    devtool: 'source-map',
    plugins: [
      ...((process.env.NODE_ENV || 'production') === 'production'
        ? sentryWebpackPlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN
          })
        : [])
    ]
  }),
  (config) => {
    return config
  }
)
