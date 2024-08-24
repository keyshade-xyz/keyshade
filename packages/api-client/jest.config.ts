import type { Config } from 'jest'

const config: Config = {
  displayName: 'api',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/api-client',
  globalSetup: './tests/config/setup.ts',
  globalTeardown: './tests/config/teardown.ts',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@api-client/(.*)$': '<rootDir>/src/$1'
  }
}

export default config
