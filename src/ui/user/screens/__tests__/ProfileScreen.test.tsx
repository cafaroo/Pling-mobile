import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ProfileScreen } from '../ProfileScreen';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text, View, StyleProp, ViewStyle } from 'react-native';

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

// Mock ImagePicker med detaljerad implementation
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'https://example.com/newavatar.jpg' }]
  }),
  MediaTypeOptions: {
    Images: 'images'
  }
}));

// Mock ProfileAvatar med testbar komponent
jest.mock('../../components/ProfileAvatar', () => {
  const ProfileAvatar = ({ 
    onPress, 
    uri, 
    size, 
    style 
  }: { 
    onPress?: () => void;
    uri?: string;
    size: number;
    style?: StyleProp<ViewStyle>;
  }) => (
    <View
      testID="profile-avatar"
      style={style}
      accessibilityRole="button"
    >
      <Text>Avatar URI: {uri || 'none'}</Text>
      {onPress && (
        <View 
          testID="avatar-edit-button" 
          accessibilityRole="button"
          onTouchEnd={onPress}
        >
          <Text>Ändra bild</Text>
        </View>
      )}
    </View>
  );
  return { ProfileAvatar };
});

// Förbättrad mock för react-native-paper
jest.mock('react-native-paper', () => {
  const actualPaper = jest.requireActual('react-native-paper');
  
  // Skapa mockar för Avatar-komponenter
  const Avatar = {
    Image: ({ 
      size, 
      source 
    }: { 
      size: number; 
      source: { uri: string } 
    }) => (
      <View testID="avatar-image" style={{ width: size, height: size }}>
        <Text>Avatar Image: {source.uri}</Text>
      </View>
    ),
    Icon: ({ 
      size, 
      icon 
    }: { 
      size: number; 
      icon: string 
    }) => (
      <View testID="avatar-icon" style={{ width: size, height: size }}>
        <Text>Avatar Icon: {icon}</Text>
      </View>
    )
  };
  
  // Skapa mockar för Button och TextInput
  const Button = ({ 
    children, 
    onPress, 
    mode, 
    loading, 
    disabled, 
    style, 
    testID 
  }: {
    children: React.ReactNode;
    onPress?: () => void;
    mode?: string;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
  }) => (
    <View
      testID={testID || 'paper-button'}
      style={style}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      onTouchEnd={onPress}
    >
      <Text>{children} {loading ? '(Loading)' : ''}</Text>
    </View>
  );
  
  const TextInput = ({ 
    label, 
    onChangeText, 
    value, 
    style, 
    multiline, 
    keyboardType, 
    testID, 
    ...props 
  }: any) => (
    <View style={style} testID={testID || `input-${label?.toLowerCase().replace(/\s/g, '-')}`}>
      <Text>{label}</Text>
      <View 
        accessibilityRole="textbox"
        onTouchEnd={() => { }}
      >
        <Text>Värde: {value || props.defaultValue || ''}</Text>
      </View>
    </View>
  );
  
  // Skapa mock för IconButton
  const IconButton = ({ 
    icon, 
    size, 
    onPress, 
    style 
  }: {
    icon: string;
    size: number;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
  }) => (
    <View
      testID={`icon-${icon}`}
      style={style}
      accessibilityRole="button"
      onTouchEnd={onPress}
    >
      <Text>Icon: {icon}</Text>
    </View>
  );
  
  // Skapa mock för useTheme
  const useTheme = () => ({
    colors: {
      primary: '#6200ee',
      surface: '#ffffff',
      background: '#f6f6f6',
      error: '#B00020',
      text: '#000000',
      disabled: '#989898',
    }
  });
  
  return {
    ...actualPaper,
    Avatar,
    Button,
    TextInput,
    IconButton,
    useTheme
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ProfileScreen', () => {
  const mockUpdateProfile = jest.fn();
  
  beforeEach(() => {
    (useUpdateProfile as jest.Mock).mockReturnValue({
      mutate: mockUpdateProfile,
      isLoading: false,
      error: null
    });
    mockUpdateProfile.mockClear();
    
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

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <PaperProvider>
            {component}
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    );
  };

  it('ska rendera utan att krascha', () => {
    const { getByText } = renderWithProviders(
      <ProfileScreen />
    );
    
    expect(getByText('Spara ändringar')).toBeTruthy();
    expect(getByText(/Avatar URI:/)).toBeTruthy();
  });

  it('ska hantera bilduppladdning när användaren klickar på profilavatar', async () => {
    const { getByTestId } = renderWithProviders(
      <ProfileScreen />
    );

    const avatarEditButton = getByTestId('avatar-edit-button');
    fireEvent(avatarEditButton, 'touchEnd');

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    });
  });

  it('ska hantera formulärinlämning och anropa updateProfile', async () => {
    const { getByText } = renderWithProviders(
      <ProfileScreen />
    );

    const submitButton = getByText('Spara ändringar');
    fireEvent(submitButton, 'touchEnd');

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      // Verifiera att data från formuläret skickas korrekt
      expect(mockUpdateProfile.mock.calls[0][0]).toHaveProperty('name');
      expect(mockUpdateProfile.mock.calls[0][0]).toHaveProperty('email');
      expect(mockUpdateProfile.mock.calls[0][0]).toHaveProperty('settings');
    });
  });

  it('ska visa laddningstillstånd när data laddas', async () => {
    // Override useUser mock för att simulera laddning
    require('../../hooks/useUser').useUser.mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
    });

    const { queryByText } = renderWithProviders(<ProfileScreen />);
    
    // ProfileScreen returnerar null när den laddar
    expect(queryByText('Spara ändringar')).toBeNull();
  });

  it('ska visa laddningstillstånd när profilen uppdateras', async () => {
    // Override useUpdateProfile för att simulera laddning
    (useUpdateProfile as jest.Mock).mockReturnValueOnce({
      mutate: mockUpdateProfile,
      isLoading: true,
      error: null
    });

    const { getByText } = renderWithProviders(<ProfileScreen />);
    
    expect(getByText('Spara ändringar (Loading)')).toBeTruthy();
  });
}); 