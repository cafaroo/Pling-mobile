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

// Mock ProfileAvatar med testbar funktion
jest.mock('../../components/ProfileAvatar', () => {
  return {
    ProfileAvatar: jest.fn().mockImplementation(props => {
      const mockProfileAvatar = {
        type: 'mockProfileAvatar',
        props: {
          testID: 'profile-avatar',
          style: props.style,
          accessibilityRole: 'button',
          children: [
            { type: 'text', props: { children: ['Avatar URI: ', props.uri || 'none'] } },
            props.onPress && {
              type: 'view',
              props: {
                testID: 'avatar-edit-button',
                accessibilityRole: 'button',
                onTouchEnd: props.onPress,
                children: [{ type: 'text', props: { children: 'Ändra bild' } }]
              }
            }
          ].filter(Boolean)
        }
      };
      
      return mockProfileAvatar;
    })
  };
});

// Förbättrad mock för react-native-paper
jest.mock('react-native-paper', () => {
  const mockAvatar = {
    Image: jest.fn().mockImplementation(props => ({
      type: 'mock-avatar-image',
      props: {
        testID: 'avatar-image',
        style: { width: props.size, height: props.size },
        children: [{ type: 'text', props: { children: ['Avatar Image: ', props.source.uri] } }]
      }
    })),
    Icon: jest.fn().mockImplementation(props => ({
      type: 'mock-avatar-icon',
      props: {
        testID: 'avatar-icon',
        style: { width: props.size, height: props.size },
        children: [{ type: 'text', props: { children: ['Avatar Icon: ', props.icon] } }]
      }
    }))
  };
  
  const mockButton = jest.fn().mockImplementation(props => ({
    type: 'mock-button',
    props: {
      testID: props.testID || 'paper-button',
      style: props.style,
      accessibilityRole: 'button',
      accessibilityState: { disabled: props.disabled },
      onPress: props.onPress,
      onTouchEnd: props.onPress,
      children: [
        { 
          type: 'text', 
          props: { 
            children: [props.children, ' ', props.loading ? '(Loading)' : ''] 
          } 
        }
      ]
    }
  }));
  
  const mockTextInput = jest.fn().mockImplementation(props => ({
    type: 'mock-text-input',
    props: {
      style: props.style,
      testID: props.testID || `input-${(props.label || '').toLowerCase().replace(/\s/g, '-')}`,
      children: [
        { type: 'text', props: { children: props.label } },
        {
          type: 'view',
          props: {
            accessibilityRole: 'textbox',
            onTouchEnd: jest.fn(),
            children: [
              { 
                type: 'text', 
                props: { 
                  children: ['Värde: ', props.value || props.defaultValue || ''] 
                } 
              }
            ]
          }
        }
      ]
    }
  }));
  
  const mockIconButton = jest.fn().mockImplementation(props => ({
    type: 'mock-icon-button',
    props: {
      testID: `icon-${props.icon}`,
      style: props.style,
      accessibilityRole: 'button',
      onTouchEnd: props.onPress,
      children: [{ type: 'text', props: { children: ['Icon: ', props.icon] } }]
    }
  }));
  
  const mockUseTheme = jest.fn().mockReturnValue({
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
    // Använd spread för att behålla övriga delar av det faktiska objektet
    ...jest.requireActual('react-native-paper'),
    Avatar: mockAvatar,
    Button: mockButton,
    TextInput: mockTextInput,
    IconButton: mockIconButton,
    useTheme: mockUseTheme
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