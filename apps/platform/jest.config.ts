// apps/platform/jest.config.ts

import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      }
    }]
  },
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx)'],
  rootDir: '.',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@public/(.*)$': '<rootDir>/public/$1'
  }
}

export default config
