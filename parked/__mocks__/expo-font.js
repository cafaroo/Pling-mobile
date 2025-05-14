// Mock för expo-font
// Löser problemet med ExpoFontLoader som saknas i testerna

// Huvudexport
const mockExpoFont = {
  // Font-laddning
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
  isLoading: jest.fn().mockReturnValue(false),
  useFonts: jest.fn().mockImplementation(() => [true, null]),
  
  // Font stylename kontroll
  processFontFamily: jest.fn(fontFamily => fontFamily),
  
  // FontDisplay enum 
  FontDisplay: {
    AUTO: 'auto',
    BLOCK: 'block',
    SWAP: 'swap',
    FALLBACK: 'fallback',
    OPTIONAL: 'optional',
  },
};

// Mock för ExpoFontLoader som anges behövas  
const mockExpoFontLoader = {
  loadAsync: jest.fn().mockResolvedValue(undefined),
  unloadAllAsync: jest.fn().mockResolvedValue(undefined),
};

// Installera modulen på global
global.ExpoFontLoader = mockExpoFontLoader;

// Fix för `requireNativeModule` internt i expo-font
jest.mock('expo-modules-core', () => {
  const original = jest.requireActual('expo-modules-core');
  return {
    ...original,
    requireNativeModule: (name) => {
      if (name === 'ExpoFontLoader') {
        return mockExpoFontLoader;
      }
      return {};
    },
  };
}, { virtual: true });

// Exportera mock-funktioner
module.exports = mockExpoFont; 
// Löser problemet med ExpoFontLoader som saknas i testerna

// Huvudexport
const mockExpoFont = {
  // Font-laddning
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
  isLoading: jest.fn().mockReturnValue(false),
  useFonts: jest.fn().mockImplementation(() => [true, null]),
  
  // Font stylename kontroll
  processFontFamily: jest.fn(fontFamily => fontFamily),
  
  // FontDisplay enum 
  FontDisplay: {
    AUTO: 'auto',
    BLOCK: 'block',
    SWAP: 'swap',
    FALLBACK: 'fallback',
    OPTIONAL: 'optional',
  },
};

// Mock för ExpoFontLoader som anges behövas  
const mockExpoFontLoader = {
  loadAsync: jest.fn().mockResolvedValue(undefined),
  unloadAllAsync: jest.fn().mockResolvedValue(undefined),
};

// Installera modulen på global
global.ExpoFontLoader = mockExpoFontLoader;

// Fix för `requireNativeModule` internt i expo-font
jest.mock('expo-modules-core', () => {
  const original = jest.requireActual('expo-modules-core');
  return {
    ...original,
    requireNativeModule: (name) => {
      if (name === 'ExpoFontLoader') {
        return mockExpoFontLoader;
      }
      return {};
    },
  };
}, { virtual: true });

// Exportera mock-funktioner
module.exports = mockExpoFont; 