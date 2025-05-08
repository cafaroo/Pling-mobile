/**
 * Standardiserad mock för AsyncStorage
 * 
 * Använd denna fil för att konsekvent mocka AsyncStorage i tester.
 * 
 * Exempel på användning:
 * ```
 * jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
 * ```
 */

// In-memory mock storage
const mockStorage = new Map<string, string>();

// Skapa ett mockAsyncStorage-objekt som kan återanvändas
export const mockAsyncStorage = {
  getItem: jest.fn((key: string) => {
    return Promise.resolve(mockStorage.get(key) || null);
  }),
  
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  
  clear: jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
  }),
  
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Array.from(mockStorage.keys()));
  }),
  
  multiGet: jest.fn((keys: string[]) => {
    const pairs = keys.map(key => [key, mockStorage.get(key) || null]);
    return Promise.resolve(pairs);
  }),
  
  multiSet: jest.fn((pairs: [string, string][]) => {
    pairs.forEach(([key, value]) => mockStorage.set(key, value));
    return Promise.resolve();
  }),
  
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => mockStorage.delete(key));
    return Promise.resolve();
  }),
  
  // Hjälpfunktioner för tester
  _getStorage: () => mockStorage,
  _reset: () => {
    mockStorage.clear();
    jest.clearAllMocks();
  }
};

// Återställ mock vid varje test
export const resetMockAsyncStorage = () => {
  mockStorage.clear();
  jest.clearAllMocks();
}; 