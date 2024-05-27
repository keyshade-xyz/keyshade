import createMDX from '@next/mdx'
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  pageExtensions: ['md', 'mdx', 'ts', 'tsx'],
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    if (!isServer) {
      config.resolve.alias["@public"] = path.join(__dirname, "public");
    }

    return config;
  },
  reactStrictMode: true,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

export default withMDX(nextConfig)