import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

export default defineConfig((options: Options) => ({
  plugins: [],
  treeshake: true,
  splitting: true,
  entryPoints: ['./src/index.ts'],
  dts: true,
  minify: true,
  clean: true,
  ...options
}))
