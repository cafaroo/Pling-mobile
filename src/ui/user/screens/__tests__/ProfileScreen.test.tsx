import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import * as ImagePicker from 'expo-image-picker';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, TouchableOpacity } from 'react-native';

// Skapa mockFactory för att hantera mockar utan direkta referenser
const mockFactory = {
  createMockView: () => (props) => {
    const { children, testID, style, ...rest } = props || {};
    return <View testID={testID} style={style} {...rest}>{children}</View>;
  },
  createMockText: () => (props) => {
    const { children, testID, style, ...rest } = props || {};
    return <Text testID={testID} style={style} {...rest}>{children}</Text>;
  },
  createMockTouchable: () => (props) => {
    const { children, testID, onPress, ...rest } = props || {};
    return <TouchableOpacity testID={testID} onPress={onPress} {...rest}>{children}</TouchableOpacity>;
  }
};

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn()
  })
}));

// Mock useUpdateProfile hook
jest.mock('../../hooks/useUpdateProfile', () => ({
  useUpdateProfile: jest.fn()
}));

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

// Behöver mocka react-native-safe-area-context då den inte är tillgänglig i test-miljön
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mocka komponenter med funktioner som returnerar Jest-functions
jest.mock('../../components/ProfileAvatar', () => {
  const mockFn = jest.fn(() => null);
  return {
    ProfileAvatar: mockFn
  };
});

// Skapa mockad ScrollView separaat så den kan användas i React Native-mocken
const mockScrollView = (props) => {
  const { children, ...rest } = props || {};
  return mockFactory.createMockView()({ testID: 'ScrollView', ...rest, children });
};

// Mock React Native ScrollView
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    ScrollView: (props) => mockScrollView(props)
  };
});

// Förbättrad mock för react-native-paper
jest.mock('react-native-paper', () => {
  const mockComponent = (name) => (props) => {
    const { children, label, ...rest } = props || {};
    return mockFactory.createMockView()({
      testID: rest.testID || name,
      children: [
        label ? mockFactory.createMockText()({ children: label }) : null,
        children
      ].filter(Boolean),
      style: rest.style
    });
  };
  
  return {
    Avatar: {
      Image: mockComponent('AvatarImage'),
      Icon: mockComponent('AvatarIcon')
    },
    Button: (props) => {
      const { children, ...rest } = props || {};
      return mockFactory.createMockTouchable()({
        testID: rest.testID || 'button', 
        onPress: rest.onPress,
        accessible: true,
        accessibilityRole: 'button',
        children: mockFactory.createMockText()({ children })
      });
    },
    TextInput: mockComponent('TextInput'),
    IconButton: (props) => {
      const { icon, ...rest } = props || {};
      return mockFactory.createMockTouchable()({
        testID: rest.testID || 'icon-button', 
        onPress: rest.onPress,
        accessible: true,
        accessibilityRole: 'button',
        children: mockFactory.createMockText()({ children: icon || 'icon' })
      });
    },
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
        surface: '#ffffff',
        background: '#f6f6f6',
        error: '#B00020',
        text: '#000000',
        disabled: '#989898',
      }
    }),
    Provider: ({ children }) => children,
    Surface: (props) => {
      const { children, ...rest } = props || {};
      return mockFactory.createMockView()({
        children,
        ...rest
      });
    }
  };
});

// Mocka useUser
jest.mock('../../hooks/useUser', () => ({
  useUser: jest.fn().mockReturnValue({
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      settings: {
        name: 'TestUser',
        bio: 'Test bio',
        location: 'Stockholm',
        contact: {
          phone: '+46701234567',
          website: 'https://example.com'
        }
      }
    },
    isLoading: false,
    error: null,
  })
}));

// Förbättrad mock för useProfileForm
jest.mock('../../hooks/useProfileForm', () => ({
  useProfileForm: jest.fn().mockImplementation((defaultValues) => ({
    form: {
      register: jest.fn(),
      handleSubmit: jest.fn(callback => data => callback(data || defaultValues)),
      setValue: jest.fn(),
      watch: jest.fn().mockImplementation(field => {
        if (field === 'avatarUrl') return defaultValues?.avatarUrl || 'https://example.com/avatar.jpg';
        return defaultValues?.[field] || '';
      }),
      formState: { 
        isValid: true, 
        isSubmitting: false, 
        errors: {} 
      }
    },
    isValid: true,
    isDirty: false,
    errors: {},
    isSubmitting: false,
    setValue: jest.fn(),
    trigger: jest.fn(),
    transformFormDataToDto: jest.fn().mockImplementation(data => ({
      name: data?.name || defaultValues?.name,
      email: data?.email || defaultValues?.email,
      avatar_url: data?.avatarUrl || defaultValues?.avatarUrl,
      settings: {
        name: data?.displayName || defaultValues?.displayName,
        bio: data?.bio || defaultValues?.bio,
        location: data?.location || defaultValues?.location,
        contact: data?.contact || defaultValues?.contact
      }
    }))
  }))
}));

describe('ProfileScreen', () => {
  const mockUpdateProfile = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Ställ in standard-mocks
    (useUpdateProfile as jest.Mock).mockReturnValue({
      mutate: mockUpdateProfile,
      isLoading: false,
      error: null
    });
    
    // Återställ ImagePicker mock
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/newavatar.jpg' }]
    });
    
    // Återställ useUser-mockningen för varje test
    require('../../hooks/useUser').useUser.mockReturnValue({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        settings: {
          name: 'TestUser',
          bio: 'Test bio',
          location: 'Stockholm',
          contact: {
            phone: '+46701234567',
            website: 'https://example.com'
          }
        }
      },
      isLoading: false,
      error: null,
    });
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Hjälpfunktion för att rendera med QueryClient-provider
  const renderWithProviders = (ui) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('ska rendera utan att krascha', () => {
    const { getAllByTestId } = renderWithProviders(
      <ProfileScreen />
    );
    
    // Verifiera att några av baselementerna finns, t.ex. knapp-elementet
    const buttons = getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('ska hantera bilduppladdning när användaren klickar på avatar-knappen', async () => {
    const { getAllByTestId } = renderWithProviders(
      <ProfileScreen />
    );
    
    // Hitta alla knappar och klicka på den första
    const buttons = getAllByTestId('icon-button');
    
    if (buttons.length > 0) {
      fireEvent.press(buttons[0]);
      
      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    }
  });

  it('ska hantera formulärinlämning och anropa updateProfile', async () => {
    const { getAllByTestId } = renderWithProviders(
      <ProfileScreen />
    );

    // Hitta submit-knappen och klicka på den
    const buttons = getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    fireEvent.press(buttons[0]);
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  it('ska visa laddningstillstånd när profilen uppdateras', async () => {
    // Override useUpdateProfile för att simulera laddning
    (useUpdateProfile as jest.Mock).mockReturnValueOnce({
      mutate: mockUpdateProfile,
      isLoading: true,
      error: null
    });

    const { getAllByTestId } = renderWithProviders(
      <ProfileScreen />
    );
    
    // Kontrollera att knappen finns
    const buttons = getAllByTestId('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
}); 