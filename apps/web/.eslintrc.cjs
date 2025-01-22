module.exports = {
  extends: ['custom/next'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  rules: {
    '@typescript-esline/explicit-function-return-type': 'off',
    'turbo/no-undeclared-env-vars': 'off'
  }
}
