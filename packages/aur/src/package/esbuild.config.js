import { build } from 'esbuild'
import envPlugin from 'esbuild-plugin-env'
import('dotenv/config')

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.cjs',
  format: 'cjs',
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  loader: { '.node': 'file' },
  plugins: [
    envPlugin({
      SENTRY_DSN: process.env.SENTRY_DSN
    })
  ]
}).catch(() => process.exit(1))
