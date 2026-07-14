module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'clover'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: { '^@src/(.*)$': '<rootDir>/src/$1' },
  preset: 'ts-jest',
  resolver: '<rootDir>/jest-resolver.js',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['(helpers|setup)\\.ts$'],
  testRegex: ['(/__tests__/.*|(\\.|/)(test|spec))\\.ts$'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|@octokit|@actions|universal-user-agent|before-after-hook)/)',
  ],
};
