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
    // Hooks-tester
    '**/src/application/shared/hooks/__tests__/createStandardizedHook.test.tsx',
    '**/src/application/subscription/hooks/__tests__/useSubscriptionStandardized.test.tsx',
    '**/src/application/team/hooks/__tests__/*.test.{ts,tsx}',
    '**/src/application/team/hooks/integration-tests/*.test.{ts,tsx}',
    '**/src/application/organization/hooks/__tests__/*.test.{ts,tsx}',
    '**/src/application/organization/hooks/integration-tests/*.test.{ts,tsx}',
    '**/src/application/user/hooks/__tests__/*.test.{ts,tsx}',
    
    // Integrationstester
    '**/src/application/*/hooks/integration-tests/*.test.{ts,tsx}',
    '**/src/ui/*/integration-tests/*.test.{ts,tsx}',
    
    // Specifika integrationstester
    '**/src/application/organization/hooks/integration-tests/organization-team-integration.test.tsx'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000 // Öka timeout för långsamma hooks-tester
}; 