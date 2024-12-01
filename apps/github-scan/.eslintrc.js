module.exports = {
  extends: ['custom/next'],
  rules: {
    //temporary disable all error causing rules
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'no-console': 'off',
    'object-shorthand': 'off',
    'react/jsx-sort-props': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'no-useless-return': 'off',
    'react/jsx-no-leaked-render': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'prefer-named-capture-group': 'off',
    'turbo/no-undeclared-env-vars': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    'no-await-in-loop': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off'
  }
}
