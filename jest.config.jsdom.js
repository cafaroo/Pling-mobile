/**
 * Specialkonfiguration för JSDOM-tester som kringgår problem med jest-expo
 * Detta används för tester som kräver JSDOM men har problem i den vanliga konfigurationen
 */
module.exports = {
  preset: './node_modules/jest-expo/jest-preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  setupFilesAfterEnv: [
    './jest.hooks.setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|expo|expo-.*|@expo|@react-native|@unimodules|unimodules|sentry-expo|react-native-.*)'
  ],
  testMatch: [
    '**/src/application/shared/hooks/__tests__/createStandardizedHook.test.tsx',
    '**/src/application/subscription/hooks/__tests__/useSubscriptionStandardized.test.tsx',
    '**/src/application/team/hooks/__tests__/*.test.{ts,tsx}',
    '**/src/application/team/hooks/integration-tests/*.test.{ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  }
}; 