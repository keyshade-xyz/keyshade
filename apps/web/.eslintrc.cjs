module.exports = {
  extends: ['custom/next'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    'turbo/no-undeclared-env-vars': 'off'
  }
}
