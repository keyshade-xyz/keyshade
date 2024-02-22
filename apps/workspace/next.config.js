const path = require("node:path");
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (!isServer) {
      config.resolve.alias["@public"] = path.join(__dirname, "public");
    }

    return config;
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
