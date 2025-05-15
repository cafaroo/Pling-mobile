/**
 * Mock för react-native-toast-message
 */
export const toast = {
  show: jest.fn(),
  hide: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}; 