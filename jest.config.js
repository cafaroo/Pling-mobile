/** @type {import('jest').Config} */
const baseConfig = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/.*)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@context/(.*)$': '<rootDir>/context/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@styles/(.*)$': '<rootDir>/styles/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@ui/components/(.*)$': '<rootDir>/src/ui/components/$1',
    '^@ui/user/(.*)$': '<rootDir>/src/ui/user/$1',
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    '^@/infrastructure/supabase/supabaseClient$': '<rootDir>/src/infrastructure/supabase/__mocks__/supabaseClient.ts',
    '^@/infrastructure/events/eventBus$': '<rootDir>/src/infrastructure/events/__mocks__/eventBus.ts',
    '^@/infrastructure/monitoring/PerformanceMonitor$': '<rootDir>/src/infrastructure/monitoring/__mocks__/PerformanceMonitor.ts'
  },
  testMatch: [
    '<rootDir>/src/domain/**/*.test.ts',
    '<rootDir>/src/application/**/*.test.ts',
    '<rootDir>/src/utils/**/*.test.ts',
    '<rootDir>/components/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/src/ui/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/src/application/user/hooks/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/src/infrastructure/**/*.test.{ts,tsx,js,jsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  globalSetup: '<rootDir>/jest.global-setup.js',
};

// Projektkonfiguration med olika testuppsättningar
const config = {
  // Använd baseConfig som grund
  ...baseConfig,
  // Projekts med multiple konfigurationer
  projects: [
    {
      // Standardkonfiguration för UI-lager och domäntester
      ...baseConfig,
      displayName: 'default',
      setupFilesAfterEnv: ['./jest.setup.js'],
    },
    {
      // Specifik konfiguration för applikationslager
      ...baseConfig,
      displayName: 'application',
      setupFilesAfterEnv: ['./jest.setup-apptest.js'],
      testMatch: [
        '<rootDir>/src/application/**/*.test.{ts,tsx,js,jsx}',
      ],
      testEnvironment: 'node',
    }
  ]
};

module.exports = config;