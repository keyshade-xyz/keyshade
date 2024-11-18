/* eslint-disable */
export default {
  forceExit: true,
  displayName: 'api',
  testEnvironment: 'node',
  testMatch: ['**/*.e2e.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  coverageReporters: ['json'],
  collectCoverage: true
}
