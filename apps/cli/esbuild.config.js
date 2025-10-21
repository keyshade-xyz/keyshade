import { build } from 'esbuild'
import envPlugin from 'esbuild-plugin-env'
import { join } from 'path'
import { readFileSync } from 'fs'

import('dotenv/config')

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
)

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.cjs',
  format: 'cjs',
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  loader: { '.node': 'file' },
  define: {
    'process.env.CLI_VERSION': `"${pkg.version}"`
  },
  plugins: [
    envPlugin({
      SENTRY_DSN: process.env.SENTRY_DSN
    })
  ]
}).catch(() => process.exit(1))
