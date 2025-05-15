// Mock för react-native-toast-message
export const toast = {
  show: jest.fn(),
  hide: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

// Standardexport för att stödja 'import Toast from "react-native-toast-message"'
export default {
  show: toast.show,
  hide: toast.hide,
  success: toast.success,
  error: toast.error,
  info: toast.info,
  warn: toast.warn
}; 