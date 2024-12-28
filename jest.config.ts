export default {
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  globalSetup: '<rootDir>/test/_config/global-setup.ts',
  globalTeardown: '<rootDir>/test/_config/global-teardown.ts',
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/test/_config/jest-setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.(spec|test|acceptance).ts'],
  collectCoverage: true,
  moduleNameMapper: {
    '@/test/(.*)': '<rootDir>/test/$1',
    '@/(.*)': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
