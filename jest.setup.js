import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock för react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock för expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [''],
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

// Mock för lucide-react-native ikoner
jest.mock('lucide-react-native', () => ({
  UserGroup: () => 'UserGroup',
  Lock: () => 'Lock',
  Globe: () => 'Globe',
  ChevronRight: () => 'ChevronRight',
  Bell: () => 'Bell',
  Settings: () => 'Settings',
  Plus: () => 'Plus',
  Users: () => 'Users'
}));

// Mock för react-native
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.NativeModules.SettingsManager = {
    getConstants: () => ({
      settings: {
        AppleLocale: 'en_US',
        AppleLanguages: ['en'],
      }
    })
  };
  rn.UIManager.measureInWindow = jest.fn((node, callback) => {
    callback(0, 0, 100, 100);
  });
  
  rn.UIManager.getViewManagerConfig = (name) => {
    if (name === 'RCTView') {
      return {
        Commands: {
          hotspotUpdate: jest.fn(),
          setPressed: jest.fn(),
        },
      };
    }
    return {};
  };
  
  return {
    ...rn,
    Platform: {
      ...rn.Platform,
      OS: 'ios',
      select: jest.fn(x => x.ios),
    },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    Animated: {
      timing: () => ({
        start: jest.fn(),
      }),
      Value: jest.fn(),
      View: 'AnimatedView',
      Text: 'AnimatedText',
    },
  };
});

// Mock för ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: {
        main: '#000000',
        light: '#333333',
        dark: '#000000'
      },
      text: {
        main: '#000000',
        light: '#666666',
        dark: '#000000'
      },
      background: {
        main: '#FFFFFF',
        light: '#F5F5F5',
        dark: '#EEEEEE',
        selected: '#E0E0E0'
      },
      error: '#FF0000',
      success: '#00FF00',
      warning: '#FFA500',
      secondary: {
        main: '#0000FF',
        light: '#3333FF',
        dark: '#0000CC'
      }
    },
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock för AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Tysta konsolvarningar under tester
console.warn = jest.fn();

// Globala test timeout
jest.setTimeout(10000);

// Mock för Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }
}));

// Mock för expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
  ImageBackground: 'ImageBackground'
}));

// Mock för expo-modules-core
jest.mock('expo-modules-core', () => ({
  EventEmitter: class {
    constructor() {}
    addListener() { return { remove: () => {} }; }
    removeAllListeners() {}
    emit() {}
  }
}));

// Mock för react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock för expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-key'
    }
  }
}));

// Mock för react-native-paper
jest.mock('react-native-paper', () => {
  const RealComponent = jest.requireActual('react-native-paper');
  const MockedModule = {
    ...RealComponent,
    Button: 'Button',
    Text: 'Text',
    TextInput: 'TextInput',
    Switch: 'Switch',
    Card: 'Card',
    Title: 'Title',
    Paragraph: 'Paragraph',
    useTheme: () => ({
      colors: {
        primary: '#000000',
        accent: '#ffffff',
        background: '#ffffff',
        text: '#000000',
        placeholder: '#888888',
        error: '#ff0000',
        surface: '#ffffff'
      }
    })
  };
  return MockedModule;
});

// Mock för Expo-specifika moduler
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(null),
}));

// Global mocks
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock för console.error för att förhindra fula felmeddelanden i testutdata
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning: An update to') || 
     args[0].includes('Warning: Cannot update a component'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Rensa mockar efter varje test
afterEach(() => {
  jest.clearAllMocks();
}); 