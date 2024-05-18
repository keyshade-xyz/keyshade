/* eslint-disable */
export default {
  forceExit: true,
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/api-key.e2e.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api'
}
