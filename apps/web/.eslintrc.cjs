module.exports = {
  extends: ['custom/next'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'turbo/no-undeclared-env-vars': 'off',
    'eslint-comments/no-unused-disable': 'off'
  },
  overrides: [
    {
      files: ['src/lib/controller-instance.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off'
      }
    }
  ]
}
