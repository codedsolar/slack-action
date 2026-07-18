/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/coverage/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'clover'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: { '^@src/(.*)$': '<rootDir>/src/$1' },
  preset: 'ts-jest',
  resolver: '<rootDir>/jest-resolver.cjs',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['(helpers|setup)\\.ts$'],
  testRegex: ['(/__tests__/.*|(\\.|/)(test|spec))\\.ts$'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: { allowJs: true },
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@actions|@octokit|universal-user-agent|before-after-hook)/)',
  ],
};
