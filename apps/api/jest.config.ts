/* eslint-disable */
export default {
  displayName: 'api',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['.*.e2e.spec.ts'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  coverageDirectory: '../../coverage/apps/api'
}
