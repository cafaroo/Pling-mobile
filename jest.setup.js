/**
 * Jest setup file för att konfigurera testmiljön
 */

import '@testing-library/jest-native/extend-expect';

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
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.SettingsManager = {
    settings: {
      AppleLocale: 'en_US',
      AppleLanguages: ['en'],
    },
  };
  
  // Mocka specifika moduler som kan orsaka problem
  RN.Alert = {
    alert: jest.fn()
  };
  
  RN.Animated = {
    ...RN.Animated,
    timing: jest.fn(() => ({
      start: jest.fn()
    })),
    Value: jest.fn(() => ({
      interpolate: jest.fn(),
      setValue: jest.fn()
    }))
  };
  
  return RN;
});

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
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockImplementation(() => {
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    })
  },
  from: jest.fn().mockImplementation((table) => {
    return {
      select: jest.fn().mockImplementation((columns) => {
        return {
          eq: jest.fn().mockImplementation((column, value) => {
            return {
              single: jest.fn().mockResolvedValue({ 
                data: { id: value, name: 'Mock Item' }, 
                error: null 
              }),
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              order: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              match: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
              }),
              gt: jest.fn().mockReturnThis(),
              lt: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              lte: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
            };
          }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { id: 'mock-id', name: 'Mock Item' }, 
            error: null 
          }),
          match: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
        };
      }),
      insert: jest.fn().mockImplementation((data) => {
        return {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { id: 'new-item-id', ...data }, 
              error: null 
            })
          })
        };
      }),
      update: jest.fn().mockImplementation((data) => {
        return {
          eq: jest.fn().mockImplementation((column, value) => {
            return {
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: value, ...data }, 
                  error: null 
                })
              }),
              single: jest.fn().mockResolvedValue({ 
                data: { id: value, ...data }, 
                error: null 
              })
            };
          }),
          match: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis()
        };
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        match: jest.fn().mockResolvedValue({ data: null, error: null }),
        in: jest.fn().mockResolvedValue({ data: null, error: null })
      }),
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'upsert-id' }, error: null })
        })
      })
    };
  }),
  rpc: jest.fn().mockImplementation((funcName, params) => {
    if (funcName === 'create_team_secure') {
      return Promise.resolve({
        data: 'test-team-id',
        error: null
      });
    }
    if (funcName === 'get_team_members_with_profiles') {
      return Promise.resolve({
        data: [
          { 
            id: 'member1', 
            team_id: params?.team_id_param || 'team1', 
            user_id: 'user1', 
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString(),
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: null,
            profile_id: 'profile1'
          }
        ],
        error: null
      });
    }
    if (funcName === 'get_user_team_role') {
      return Promise.resolve({
        data: 'admin',
        error: null
      });
    }
    if (funcName === 'update_team_member_role') {
      return Promise.resolve({
        data: {
          id: params?.p_member_id || 'member1',
          role: params?.p_new_role || 'member'
        },
        error: null
      });
    }
    if (funcName === 'join_team_with_code') {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Gick med i teamet',
          team_id: 'team1',
          team_name: 'Testteam'
        },
        error: null
      });
    }
    if (funcName === 'leave_team') {
      return Promise.resolve({
        data: true,
        error: null
      });
    }
    return Promise.resolve({ data: null, error: null });
  }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.png' } }),
      remove: jest.fn().mockResolvedValue({ error: null })
    })
  }
};

// Mocka supabase för alla möjliga sökvägar
const mockSupabase = {
  supabase: mockSupabaseClient,
  createClient: jest.fn().mockReturnValue(mockSupabaseClient)
};

// Fortsätt att använda olika varianter av sökvägar för att säkerställa att alla mockas korrekt
jest.mock('src/infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('src/infrastructure/supabase/index', () => mockSupabase, { virtual: true });
jest.mock('@/infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('@/infrastructure/supabase/index', () => mockSupabase, { virtual: true });
jest.mock('../infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('../infrastructure/supabase/index', () => mockSupabase, { virtual: true });
jest.mock('../../infrastructure/supabase/index.ts', () => mockSupabase, { virtual: true });
jest.mock('../../infrastructure/supabase/index', () => mockSupabase, { virtual: true });

// Mocka även lib/supabase och @/lib/supabase för att täcka alla tänkbara importsökvägar
jest.mock('lib/supabase', () => mockSupabase, { virtual: true });
jest.mock('@/lib/supabase', () => mockSupabase, { virtual: true });
jest.mock('../lib/supabase', () => mockSupabase, { virtual: true });
jest.mock('../../lib/supabase', () => mockSupabase, { virtual: true });

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
  if (args[0].includes('Warning:')) {
    return;
  }
  console.error(...args);
}); 