/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|@testing-library|react-native-paper|react-native-gesture-handler|react-native-toast-message|@react-native-async-storage|expo|expo-.*|@expo.*|sentry-expo|native-base|@tanstack)/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
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
    '^@/infrastructure/monitoring/PerformanceMonitor$': '<rootDir>/src/infrastructure/monitoring/__mocks__/PerformanceMonitor.ts',
    'react-native-toast-message': '<rootDir>/__mocks__/react-native-toast-message.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^stripe$': '<rootDir>/__mocks__/stripe.js',
    '^stripe-react-native$': '<rootDir>/__mocks__/stripe-react-native.js'
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>'],
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  globalSetup: '<rootDir>/jest.global-setup.js',
  projects: [
    {
      displayName: 'default',
      testEnvironment: 'jsdom',
    },
    {
      displayName: 'application',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/application/**/*.test.{ts,tsx,js,jsx}',
      ],
    },
    {
      displayName: 'hooks',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/application/**/hooks/**/*.test.{ts,tsx,js,jsx}'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/jest.hooks.setup.js'
      ],
      transform: {
        '^.+\\.[jt]sx?$': [
          'babel-jest',
          {
            configFile: './babel.config.js'
          }
        ]
      },
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|@testing-library|react-native-paper|react-native-gesture-handler|react-native-toast-message|@react-native-async-storage|expo|expo-.*|@expo.*|sentry-expo|native-base|@tanstack)/'
      ]
    },
    {
      displayName: 'subscription',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/application/subscription/**/*.test.{ts,tsx,js,jsx}',
      ],
      setupFilesAfterEnv: [
        '<rootDir>/src/application/subscription/hooks/__tests__/subscription-setup.js',
        '<rootDir>/src/application/subscription/hooks/__tests__/jest-dom-setup.js'
      ],
    }
  ]
};