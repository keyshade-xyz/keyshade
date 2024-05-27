module.exports = {
  extends: ['custom/next'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  rules: {
    'import/no-extraneous-dependencies': 0
  }
}
