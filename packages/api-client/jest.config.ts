import type { Config } from 'jest'

const config: Config = {
  displayName: 'api',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  globalSetup: './tests/config/setup.ts',
  globalTeardown: './tests/config/teardown.ts',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@api-client/(.*)$': '<rootDir>/src/$1'
  },
  coverageDirectory: '../../coverage/packages/api-client',
  coverageReporters: ['json'],
  collectCoverage: true
}

export default config
