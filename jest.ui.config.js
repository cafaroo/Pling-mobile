/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
        plugins: ['@babel/plugin-transform-modules-commonjs']
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|@testing-library|react-native-paper|react-native-gesture-handler|react-native-toast-message|@react-native-async-storage|expo|expo-.*|@expo.*|sentry-expo|native-base|@tanstack|react-hook-form|zod|react-native-calendars|lucide-react-native)/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup-apptest.js'],
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
    '@testing-library/react-native': '<rootDir>/__mocks__/@testing-library/react-native.js',
    'react-hook-form': '<rootDir>/__mocks__/react-hook-form.js',
    'expo-router': '<rootDir>/__mocks__/expo-router.js',
    'zod': '<rootDir>/__mocks__/zod.js',
    'react-native-calendars': '<rootDir>/__mocks__/react-native-calendars.js',
    'expo-linear-gradient': '<rootDir>/__mocks__/expo-linear-gradient.js'
  },
  testMatch: [
    '<rootDir>/components/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/src/ui/**/*.test.{ts,tsx,js,jsx}'
  ],
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>'],
  globalSetup: '<rootDir>/jest.global-setup.js',
  testTimeout: 15000,
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'src/ui/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
}; 