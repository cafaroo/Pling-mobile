/**
 * Jest setup file för att konfigurera testmiljön
 */

// Konfigurera globala objekt för JSDOM
if (typeof document === 'undefined') {
  global.document = {
    createElement: jest.fn(() => ({})),
    createTextNode: jest.fn(() => ({})),
    querySelector: jest.fn(() => ({})),
  };
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    document: global.document,
  };
}

import '@testing-library/jest-native/extend-expect';
import { configure } from '@testing-library/react-native';

// Konfigurera testing library
configure({
  asyncUtilTimeout: 5000, // default timeout för waitFor
});

// Mocka miljövariabler för tester
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-test-supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-testing';
process.env.SUPABASE_TEST_URL = 'https://mock-test-supabase.co';
process.env.SUPABASE_TEST_ANON_KEY = 'mock-anon-key-for-testing';
process.env.API_URL = 'https://mock-api.pling.app/api';
process.env.DOMAIN = 'mock.pling.app';
process.env.ENVIRONMENT = 'test';

// Konfigurera global
global.__reanimatedLoggerConfig = { start: () => {}, stop: () => {} };

// Konfigurera global.__mocks__ för tester som använder det
global.__mocks__ = {
  mockCacheService: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn()
  }
};

// Mocka react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mocka react-native-paper
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    Portal: ({ children }) => children,
  };
});

// Mocka react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
  Toast: {
    show: jest.fn(),
    hide: jest.fn(),
  },
  toast: {
    show: jest.fn(),
    hide: jest.fn(),
  }
}));

// Mocka expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mocka expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  Link: 'Link',
}));

// Mocka @tanstack/react-query
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    }),
    useMutation: jest.fn().mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
      isSuccess: false,
    }),
  };
});

// Mocka typer som används i tester
jest.mock('@types/shared', () => {
  return require('./src/test-utils/__mocks__/typesMock').default;
}, { virtual: true });

// Konfigurera global
global = {
  ...global,
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  __mockEventBus: {
    publish: jest.fn().mockImplementation(async (eventType, payload) => {
      // Standardisera payload baserat på eventtyp
      const enhancedPayload = (() => {
        if (!payload) return {};
        
        switch (eventType) {
          case 'subscription.created':
            return {
              ...payload,
              planId: payload.planId || 'unknown-plan',
              status: payload.status || 'active',
              timestamp: payload.timestamp || new Date()
            };
          
          case 'subscription.updated':
            return {
              ...payload,
              status: payload.status || 'active',
              timestamp: payload.timestamp || new Date()
            };
          
          default:
            return payload;
        }
      })();
      
      // Lagra event för verifiering i tester
      if (!global.__publishedEvents) {
        global.__publishedEvents = [];
      }
      
      global.__publishedEvents.push({
        eventType,
        payload: enhancedPayload
      });
      
      return Promise.resolve();
    }),
    
    subscribe: jest.fn().mockImplementation((eventType, callback) => {
      return {
        unsubscribe: jest.fn()
      };
    }),
    
    unsubscribe: jest.fn(),
    
    clearListeners: jest.fn()
  },
  __mockUniqueId: function(id) {
    return {
      toString: () => id || 'mock-id',
      value: id || 'mock-id'
    };
  },
  fetch: jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    })
  ),
};

global.Error = global.Error || Error;

// Lägg till Promise på global.fetch för att undvika "native promise missing" fel
global.fetch.Promise = Promise;

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
    SafeAreaView: ({ children }) => children,
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
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn(obj => obj.android || obj.default),
    Version: 28
  },
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 360, height: 640 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  NativeModules: {
    SettingsManager: {
      settings: {
        AppleLocale: 'sv_SE',
        AppleLanguages: ['sv-SE']
      }
    }
  },
  StyleSheet: {
    create: styles => styles,
    compose: (style1, style2) => ({ ...style1, ...style2 }),
    flatten: jest.fn(style => style)
  },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  FlatList: 'FlatList',
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    createAnimatedComponent: jest.fn((component) => component),
    timing: jest.fn(() => ({
      start: jest.fn((callback) => callback && callback()),
    })),
    Value: jest.fn((val) => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({
        interpolate: jest.fn(),
      })),
    })),
  },
}));

// Mock för react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
  Toast: {
    show: jest.fn(),
    hide: jest.fn(),
  },
  toast: {
    show: jest.fn(),
    hide: jest.fn(),
  }
}));

// Mocka Clipboard från expo
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true)
}));

// Mocka AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  mergeItem: jest.fn(),
  multiMerge: jest.fn(),
}));

// Mocka react-native-paper
jest.mock('react-native-paper', () => {
  return {
    Provider: ({ children }) => children,
    DefaultTheme: {
      colors: {
        primary: '#6200ee',
      },
    },
    Button: ({ children, onPress }) => ({ children, onPress }),
    TextInput: ({ label, value, onChangeText }) => ({ label, value, onChangeText }),
    Appbar: {
      Header: ({ children }) => children,
      BackAction: () => null,
      Content: ({ children }) => children,
    },
  };
});

// Globala mockar för komponenttester
global.mockUseNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn()
});

// Förbered för att mocka useAuth om det behövs
global.mockUseAuth = (overrides = {}) => ({
  user: { id: 'test-user-id', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn().mockResolvedValue({ success: true }),
  signOut: jest.fn().mockResolvedValue({ success: true }),
  signUp: jest.fn().mockResolvedValue({ success: true }),
  updatePassword: jest.fn().mockResolvedValue({ success: true }),
  ...overrides
});

// Mock LoggingService
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

class MockLoggingService {
  static getInstance() {
    return mockLogger;
  }
}

jest.mock('./src/infrastructure/logger/LoggingService', () => ({
  LoggingService: MockLoggingService
}));

// Mock PerformanceMonitor
const mockPerformance = {
  measure: jest.fn().mockImplementation((_, __, fn) => fn()),
};

class MockPerformanceMonitor {
  static getInstance() {
    return mockPerformance;
  }
}

jest.mock('./src/infrastructure/monitoring/PerformanceMonitor', () => ({
  PerformanceMonitor: MockPerformanceMonitor
}));

// Mock CacheService
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  updateOptions: jest.fn(),
};

class MockCacheService {
  constructor() {
    return mockCacheService;
  }
}

jest.mock('./src/infrastructure/cache/CacheService', () => ({
  CacheService: MockCacheService
}));

// Exportera mockarna för användning i tester
global.__mocks__ = {
  mockAsyncStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    mergeItem: jest.fn(),
    multiMerge: jest.fn(),
  },
  mockCacheService,
  mockLogger,
  mockPerformance,
};

// Använd en mer konsistent och generisk mock för ThemeProvider
jest.mock('@context/ThemeContext', () => ({
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

// Också mocka med @/-prefix för retrokompatibilitet
jest.mock('@/context/ThemeContext', () => ({
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
jest.mock('@/lib/supabase', () => {
  const mockAuth = {
    signIn: jest.fn().mockResolvedValue({ data: null, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null })
  };

  const mockFrom = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        data: [],
        error: null
      }),
      match: jest.fn().mockReturnValue({
        data: [],
        error: null
      }),
      data: [],
      error: null
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      match: jest.fn().mockResolvedValue({ data: null, error: null })
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null })
    })
  });

  return {
    supabase: {
      from: mockFrom,
      auth: mockAuth,
      rpc: jest.fn().mockResolvedValue({ data: null, error: null })
    }
  };
});

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
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/subscriptions')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 'sub-123',
        status: 'active',
        currentPeriodStart: Date.now() / 1000,
        currentPeriodEnd: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000
      })
    });
  }

  // Generisk fallback för andra anrop
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
});

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
  global.fetch.mockClear();
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
  default: {}
}), { virtual: true });

jest.mock('react-native-gesture-handler/jestSetup', () => ({}), { virtual: true });

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

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

// Mocka TextInput med både default export och named export
jest.mock('@components/ui/TextInput', () => {
  const TextInput = ({ label, value, onChangeText, placeholder, error, autoFocus }) => (
    <input 
      data-testid="mock-text-input" 
      placeholder={placeholder} 
      value={value} 
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      aria-label={label}
      data-error={error}
    />
  );
  
  return {
    __esModule: true,
    default: TextInput,
    TextInput
  };
}, { virtual: true });

// För retrokompatibilitet, också mocka @/components/ui/TextInput
jest.mock('@/components/ui/TextInput', () => {
  const TextInput = ({ label, value, onChangeText, placeholder, error, autoFocus }) => (
    <input 
      data-testid="mock-text-input" 
      placeholder={placeholder} 
      value={value} 
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      aria-label={label}
      data-error={error}
    />
  );
  
  return {
    __esModule: true,
    default: TextInput,
    TextInput
  };
}, { virtual: true });

// Mocka både default export och named export för Button
jest.mock('@components/ui/Button', () => {
  const Button = ({ title, onPress, Icon, variant, size, style }) => (
    <div 
      onClick={onPress} 
      data-testid="mock-button"
    >
      {title}
      {Icon && <Icon data-testid="mock-icon" />}
    </div>
  );
  
  return {
    __esModule: true,
    default: Button,
    Button
  };
}, { virtual: true });

// För retrokompatibilitet, också mocka @/components/ui/Button
jest.mock('@/components/ui/Button', () => {
  const Button = ({ title, onPress, Icon, variant, size, style }) => (
    <div 
      onClick={onPress} 
      data-testid="mock-button"
    >
      {title}
      {Icon && <Icon data-testid="mock-icon" />}
    </div>
  );
  
  return {
    __esModule: true,
    default: Button,
    Button
  };
}, { virtual: true });

// Mocka även komponenten TeamForm
jest.mock('../components/team/TeamForm', () => {
  const MockTeamForm = ({ onSubmit, submitLabel, initialValues }) => {
    return (
      <div data-testid="mock-team-form" data-props={JSON.stringify({ submitLabel, initialValues })}>
        <button
          onClick={() => onSubmit && onSubmit(initialValues?.name || 'Test Team')}
          data-testid="mock-submit-button"
        >
          {submitLabel}
        </button>
      </div>
    );
  };
  
  return MockTeamForm;
}, { virtual: true });

// Undvik varningar från React
jest.spyOn(console, 'error').mockImplementation((...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError(...args);
});

// Tillägg för mock av SubscriptionService-metoder
jest.mock('./src/domain/subscription/services/DefaultSubscriptionService', () => {
  const original = jest.requireActual('./src/domain/subscription/services/DefaultSubscriptionService');
  return {
    ...original,
  };
});

// Konfigurera Testing Library manuellt
global.expect.extend({
  toBeVisible(received) {
    const pass = received !== null && received !== undefined;
    return {
      message: () => `expected ${received} to be visible`,
      pass,
    };
  },
  toBeDisabled(received) {
    const pass = received !== null && received !== undefined && received.props && received.props.disabled === true;
    return {
      message: () => `expected ${received} to be disabled`,
      pass,
    };
  },
  toHaveTextContent(received, text) {
    const pass = received !== null && received !== undefined && 
      ((received.props && received.props.children === text) ||
       (received.props && typeof received.props.children === 'string' && received.props.children.includes(text)));
    return {
      message: () => `expected ${received} to have text content "${text}"`,
      pass,
    };
  }
});

// Mock för eventBus
jest.mock('@/infrastructure/events/eventBus', () => ({
  eventBus: {
    publish: jest.fn(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
  }
})); 