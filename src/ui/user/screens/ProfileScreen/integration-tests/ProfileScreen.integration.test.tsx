import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileScreenContainer } from '../ProfileScreenContainer';
import { useUserWithStandardHook } from '@/application/user/hooks/useUserWithStandardHook';
import { Result } from '@/shared/core/Result';

// Mock beroenden
jest.mock('@/application/user/hooks/useUserWithStandardHook');
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock React Native komponenter
jest.mock('react-native-paper', () => ({
  TextInput: ({ label, value, onChangeText, testID }: any) => (
    <input 
      type="text" 
      placeholder={label} 
      value={value} 
      onChange={(e) => onChangeText(e.target.value)} 
      data-testid={testID}
    />
  ),
  Button: ({ onPress, children }: any) => (
    <button onClick={onPress} data-testid={`button-${children}`}>
      {children}
    </button>
  ),
  ActivityIndicator: () => <div data-testid="loading-indicator" />,
  Avatar: {
    Image: ({ source }: any) => <img src={source.uri} data-testid="profile-image" />,
  },
}));

describe('ProfileScreen Integration Tests', () => {
  // Skapa ny QueryClient för varje test
  let queryClient: QueryClient;
  
  // Mock-implementation av useUserWithStandardHook
  const mockGetUserProfile = jest.fn();
  const mockUpdateUserProfile = jest.fn();
  
  // Mock-data
  const mockUserProfile = {
    id: 'user-1',
    name: 'Test Användare',
    email: 'test@example.com',
    photoUrl: 'https://example.com/photo.jpg',
    bio: 'Test biografi',
    phone: '+46701234567'
  };
  
  // Konfigurera mocks före varje test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
      },
    });
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Konfigurera useUserWithStandardHook mock
    (useUserWithStandardHook as jest.Mock).mockReturnValue({
      getUserProfile: {
        data: mockUserProfile,
        isLoading: false,
        error: null,
        execute: mockGetUserProfile,
      },
      updateUserProfile: {
        isLoading: false,
        error: null,
        execute: mockUpdateUserProfile.mockImplementation(() => Promise.resolve(Result.ok(true))),
      },
      uploadProfileImage: {
        isLoading: false,
        error: null,
        execute: jest.fn().mockImplementation(() => Promise.resolve(Result.ok({ url: 'https://example.com/new-photo.jpg' }))),
      }
    });
  });
  
  it('laddar och visar användarprofil', async () => {
    // Rendera komponenten med QueryClient-provider
    const { getByTestId, getByDisplayValue } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att getUserProfile anropas
    expect(mockGetUserProfile).toHaveBeenCalled();
    
    // Verifiera att profilinformation visas i formuläret
    expect(getByDisplayValue(mockUserProfile.name)).toBeTruthy();
    expect(getByDisplayValue(mockUserProfile.email)).toBeTruthy();
    expect(getByDisplayValue(mockUserProfile.bio)).toBeTruthy();
    expect(getByDisplayValue(mockUserProfile.phone)).toBeTruthy();
    expect(getByTestId('profile-image')).toBeTruthy();
  });
  
  it('visar laddningsindikator när data hämtas', async () => {
    // Konfigurera loading state
    (useUserWithStandardHook as jest.Mock).mockReturnValue({
      getUserProfile: {
        data: null,
        isLoading: true,
        error: null,
        execute: mockGetUserProfile,
      },
      updateUserProfile: {
        isLoading: false,
        error: null,
        execute: mockUpdateUserProfile,
      },
      uploadProfileImage: {
        isLoading: false,
        error: null,
        execute: jest.fn()
      }
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('visar felmeddelande när datahämtning misslyckas', async () => {
    // Konfigurera error state
    (useUserWithStandardHook as jest.Mock).mockReturnValue({
      getUserProfile: {
        data: null,
        isLoading: false,
        error: { message: 'Kunde inte hämta profilinformation' },
        execute: mockGetUserProfile,
      },
      updateUserProfile: {
        isLoading: false,
        error: null,
        execute: mockUpdateUserProfile,
      },
      uploadProfileImage: {
        isLoading: false,
        error: null,
        execute: jest.fn()
      }
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att felmeddelande visas
    expect(getByTestId('error-message')).toBeTruthy();
  });
  
  it('kan uppdatera användarprofil', async () => {
    // Rendera komponenten
    const { getByTestId, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreenContainer />
      </QueryClientProvider>
    );
    
    // Hitta textfältet för namn och ändra det
    const nameInput = getByTestId('name-input');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Uppdaterat Namn' } });
    });
    
    // Hitta textfältet för bio och ändra det
    const bioInput = getByTestId('bio-input');
    await act(async () => {
      fireEvent.change(bioInput, { target: { value: 'Uppdaterad biografi' } });
    });
    
    // Hitta och klicka på Spara-knappen
    const saveButton = getByTestId('button-Spara');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Verifiera att updateUserProfile anropas med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Uppdaterat Namn',
        bio: 'Uppdaterad biografi'
      }));
    });
  });
  
  it('visar laddningsindikator när profilen uppdateras', async () => {
    // Konfigurera update loading state
    (useUserWithStandardHook as jest.Mock).mockReturnValue({
      getUserProfile: {
        data: mockUserProfile,
        isLoading: false,
        error: null,
        execute: mockGetUserProfile,
      },
      updateUserProfile: {
        isLoading: true,
        error: null,
        execute: mockUpdateUserProfile,
      },
      uploadProfileImage: {
        isLoading: false,
        error: null,
        execute: jest.fn()
      }
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att uppdateringsladdningsindikator visas
    expect(getByTestId('update-loading-indicator')).toBeTruthy();
  });
  
  it('visar felmeddelande när uppdatering misslyckas', async () => {
    // Konfigurera getUserProfile för att returnera data men updateUserProfile för att misslyckas
    (useUserWithStandardHook as jest.Mock).mockReturnValue({
      getUserProfile: {
        data: mockUserProfile,
        isLoading: false,
        error: null,
        execute: mockGetUserProfile,
      },
      updateUserProfile: {
        isLoading: false,
        error: { message: 'Kunde inte uppdatera profilen' },
        execute: mockUpdateUserProfile.mockImplementation(() => Promise.resolve(Result.err(new Error('Kunde inte uppdatera profilen')))),
      },
      uploadProfileImage: {
        isLoading: false,
        error: null,
        execute: jest.fn()
      }
    });
    
    // Rendera komponenten
    const { getByTestId, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreenContainer />
      </QueryClientProvider>
    );
    
    // Hitta och klicka på Spara-knappen
    const saveButton = getByTestId('button-Spara');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Verifiera att felmeddelandet visas efter sparförsök
    await waitFor(() => {
      expect(getByTestId('update-error-message')).toBeTruthy();
      expect(getByText('Kunde inte uppdatera profilen')).toBeTruthy();
    });
  });
}); 