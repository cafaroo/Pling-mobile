// Mocka miljövariabler för tester
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-test-supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-testing';
process.env.SUPABASE_TEST_URL = 'https://mock-test-supabase.co';
process.env.SUPABASE_TEST_ANON_KEY = 'mock-anon-key-for-testing';
process.env.API_URL = 'https://mock-api.pling.app/api';
process.env.DOMAIN = 'mock.pling.app';
process.env.ENVIRONMENT = 'test';

// Konfigurera global
global = {
  ...global,
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  __mockEventBus: {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockImplementation(() => ({ unsubscribe: jest.fn() })),
    unsubscribe: jest.fn()
  },
  __mockUniqueId: function(id) {
    return {
      toString: () => id || 'mock-id',
      value: id || 'mock-id'
    };
  },
};

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';
import '@testing-library/jest-dom';
import 'jest-expect-message';

// Konfigurera testmiljövariabler
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.NODE_ENV = 'test';

// Öka timeout för långsammare tester
jest.setTimeout(10000);

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
    back: jest.fn(),
  }),
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// Mock för react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    ...jest.requireActual('react-native-safe-area-context'),
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock för expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock för react-native/Settings
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// Mock för NativeEventEmitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const NativeEventEmitter = jest.fn();
  NativeEventEmitter.prototype.addListener = jest.fn();
  NativeEventEmitter.prototype.removeListener = jest.fn();
  return NativeEventEmitter;
});

// Mock för react-native komponenter
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.SettingsManager = {
    settings: {
      AppleLocale: 'en_US',
      AppleLanguages: ['en'],
    },
  };
  return RN;
});

// Mock för react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock för @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock för ThemeContext
jest.mock('src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#000000',
      secondary: '#0000FF',
      background: '#FFFFFF',
      text: '#000000',
      error: '#FF0000',
      success: '#00FF00',
      warning: '#FFA500'
    },
  }),
  ThemeProvider: ({ children }) => children,
}), { virtual: true });

// Mock för Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockImplementation(() => {
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    })
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis()
};

// Mocka supabase för alla möjliga sökvägar
const mockSupabase = {
  supabase: mockSupabaseClient,
  createClient: jest.fn().mockReturnValue(mockSupabaseClient)
};

// Fönsätt att använda olika varianter av sökvägar för att säkerställa att alla mockas korrekt
jest.mock('src/infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('src/infrastructure/supabase/index', () => mockSupabase, { virtual: true });
jest.mock('@/infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('@/infrastructure/supabase/index', () => mockSupabase, { virtual: true });
jest.mock('../infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('../infrastructure/supabase/index', () => mockSupabase, { virtual: true });
jest.mock('../../infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('../../infrastructure/supabase/index', () => mockSupabase, { virtual: true });

// Lägg även till en mock för src/infrastructure/supabase/hooks/useSupabase.ts
jest.mock('src/infrastructure/supabase/hooks/useSupabase.ts', () => ({
  useSupabase: jest.fn().mockReturnValue({
    supabase: mockSupabaseClient
  })
}), { virtual: true });
jest.mock('src/infrastructure/supabase/hooks/useSupabase', () => ({
  useSupabase: jest.fn().mockReturnValue({
    supabase: mockSupabaseClient
  })
}), { virtual: true });
jest.mock('@/infrastructure/supabase/hooks/useSupabase', () => ({
  useSupabase: jest.fn().mockReturnValue({
    supabase: mockSupabaseClient
  })
}), { virtual: true });

// Mock för expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
  ImageBackground: 'ImageBackground'
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

// Mock för expo-modules-core
jest.mock('expo-modules-core', () => ({
  EventEmitter: class {
    constructor() {}
    addListener() { return { remove: () => {} }; }
    removeAllListeners() {}
    emit() {}
  }
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

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

// Polyfills och miljövariabler som behövs före testmiljön
process.env.EXPO_ROUTER_APP_ROOT = '../../app';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Grundläggande globala mockar
global.fetch = jest.fn();
global.__reanimatedWorkletInit = jest.fn();

// React Native specifika mockar
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  default: {},
}));

jest.mock('react-native-gesture-handler/jestSetup', () => ({}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  usePathname: () => '',
}));

// Tysta RN-varningar
// (Mockar för @react-native-clipboard/clipboard, @react-native-community/push-notification-ios och ProgressBarAndroid tas bort härifrån)
// (Mock för expo-router tas också bort härifrån)

// Tysta alla console.warn i testmiljön
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Mock för @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const originalModule = jest.requireActual('@expo/vector-icons');
  
  const IconComponents = {};
  // Skapa mockar för alla ikoner som finns i vector-icons
  const iconNames = [
    'Ionicons', 
    'MaterialIcons', 
    'FontAwesome', 
    'MaterialCommunityIcons', 
    'Feather', 
    'AntDesign',
    'Entypo',
    'EvilIcons',
    'Fontisto',
    'Foundation',
    'Octicons',
    'SimpleLineIcons',
    'Zocial'
  ];
  
  iconNames.forEach(iconName => {
    IconComponents[iconName] = ({ name, size, color, style }) => ({
      type: 'Icon',
      props: { name, size, color, style }
    });
  });
  
  // Mocka createIconSetFromIcoMoon och liknande
  const mockCreateIconSet = () => {
    return function MockIcon({ name, size, color, style }) {
      return {
        type: 'Icon',
        props: { name, size, color, style }
      };
    };
  };
  
  return {
    ...originalModule,
    ...IconComponents,
    createIconSet: mockCreateIconSet,
    createIconSetFromIcoMoon: mockCreateIconSet,
    createIconSetFromFontello: mockCreateIconSet,
    createMultiStyleIconSet: mockCreateIconSet,
    // Lägger till en mock för isLoaded-funktionen som används av createIconSet
    Font: {
      isLoaded: jest.fn().mockReturnValue(true),
    }
  };
}); 