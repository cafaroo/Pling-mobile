/**
 * Mock för @react-native-async-storage/async-storage
 * Används för att mocka AsyncStorage i tester
 */

interface StorageData {
  [key: string]: string;
}

/**
 * In-memory mock-implementation av AsyncStorage
 */
export const mockAsyncStorage = {
  store: {} as StorageData,
  
  // Huvudmetoder
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorage.store[key] = value;
    return Promise.resolve();
  }),
  
  getItem: jest.fn((key: string) => {
    return Promise.resolve(mockAsyncStorage.store[key] || null);
  }),
  
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStorage.store[key];
    return Promise.resolve();
  }),
  
  // Batch-operationer
  multiSet: jest.fn((keyValuePairs: Array<[string, string]>) => {
    keyValuePairs.forEach(([key, value]) => {
      mockAsyncStorage.store[key] = value;
    });
    return Promise.resolve();
  }),
  
  multiGet: jest.fn((keys: string[]) => {
    const results = keys.map(key => [key, mockAsyncStorage.store[key] || null]);
    return Promise.resolve(results);
  }),
  
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach(key => {
      delete mockAsyncStorage.store[key];
    });
    return Promise.resolve();
  }),
  
  // Förvaltningsmetoder
  clear: jest.fn(() => {
    mockAsyncStorage.store = {};
    return Promise.resolve();
  }),
  
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(mockAsyncStorage.store));
  }),
  
  // Hjälpmetoder för tester
  reset: () => {
    mockAsyncStorage.store = {};
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.multiSet.mockClear();
    mockAsyncStorage.multiGet.mockClear();
    mockAsyncStorage.multiRemove.mockClear();
    mockAsyncStorage.clear.mockClear();
    mockAsyncStorage.getAllKeys.mockClear();
  }
}; 