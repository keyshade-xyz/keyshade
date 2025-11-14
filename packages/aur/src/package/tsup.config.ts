import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

const env = process.env.NODE_ENV

export default defineConfig((options: Options) => ({
  plugins: [],
  treeshake: true,
  splitting: true,
  entryPoints: ['src/index.ts'],
  dts: true,
  minify: env === 'production',
  clean: true,
  ...options
}))
