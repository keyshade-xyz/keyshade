/* eslint-disable */
export default {
  forceExit: true,
  displayName: 'api',
  testEnvironment: 'node',
  testMatch: [
    '**/{api-key,auth,environment,feedback,integration,project,secret,share-secret,user,variable,workspace-membership,workspace-role}.e2e.spec.ts'
  ],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(?:@vercel/sdk)/)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  coverageDirectory: '../../coverage/apps/api',
  coverageReporters: ['json'],
  collectCoverage: true
}
