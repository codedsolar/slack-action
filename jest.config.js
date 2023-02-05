module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['**/*.ts', '!**/coverage/**', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['jest\\.(.*)\\.ts$'],
};
