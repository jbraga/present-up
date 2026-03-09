module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo($|/|-)|@expo|@unimodules|unimodules|sentry-expo|native-base|@?react-native-community)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@mocks/(.*)$': '<rootDir>/src/mocks/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
};
