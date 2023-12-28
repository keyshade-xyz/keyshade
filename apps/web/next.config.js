//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    if (!isServer) {
      config.resolve.alias['@public'] = path.join(__dirname, 'public')
    }

    return config
  }
}

module.exports = nextConfig

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx
]
