import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileScreenContainer } from '../ProfileScreenContainer';
import { useUserWithStandardHook } from '@/application/user/hooks/useUserWithStandardHook';
import { useUpdateProfile } from '@/application/user/hooks/useUpdateProfile';

// Mocka hooks
jest.mock('@/application/user/hooks/useUserWithStandardHook');
jest.mock('@/application/user/hooks/useUpdateProfile');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn()
  }),
  useLocalSearchParams: () => ({
    userId: 'current-user-id'
  })
}));

describe('ProfileScreen Integration Test', () => {
  // Skapa mock-data
  const mockUser = {
    id: 'current-user-id',
    email: 'test@example.com',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      bio: 'This is a test bio',
      avatarUrl: 'https://example.com/avatar.jpg',
      phoneNumber: '+46701234567',
      location: 'Stockholm',
      jobTitle: 'Developer',
      company: 'Test Company',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/testuser',
        twitter: 'https://twitter.com/testuser',
        github: 'https://github.com/testuser'
      }
    },
    settings: {
      language: 'sv',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        teamUpdates: true
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false
      }
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-06-01T00:00:00.000Z',
    lastLogin: '2023-06-10T00:00:00.000Z',
    isActive: true
  };
  
  const mockUseUserWithStandardHook = useUserWithStandardHook as jest.Mock;
  const mockUseUpdateProfile = useUpdateProfile as jest.Mock;
  
  // Konfigurera QueryClient för tester
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });
  
  // Återställ mocks före varje test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mocka useUserWithStandardHook
    mockUseUserWithStandardHook.mockImplementation(() => ({
      getUser: {
        data: mockUser,
        isLoading: false,
        error: null,
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: mockUser }),
        retry: jest.fn()
      }
    }));
    
    // Mocka useUpdateProfile
    mockUseUpdateProfile.mockImplementation(() => ({
      updateProfile: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { ...mockUser.profile } }),
        isLoading: false,
        error: null
      },
      updateAvatar: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { avatarUrl: 'https://example.com/new-avatar.jpg' } }),
        isLoading: false,
        error: null
      },
      updateSocialLinks: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { ...mockUser.profile.socialLinks } }),
        isLoading: false,
        error: null
      }
    }));
  });
  
  // Renderings-hjälpfunktion
  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <ProfileScreenContainer userId="current-user-id" />
        </QueryClientProvider>
      </NavigationContainer>
    );
  };
  
  it('bör visa användarprofildata när data laddats framgångsrikt', async () => {
    renderScreen();
    
    // Verifiera att skärmen visar användarnamn
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeTruthy();
    });
    
    // Verifiera att profil visas
    expect(screen.getByText('This is a test bio')).toBeTruthy();
    expect(screen.getByText('Stockholm')).toBeTruthy();
    expect(screen.getByText('Developer')).toBeTruthy();
    expect(screen.getByText('Test Company')).toBeTruthy();
  });
  
  it('bör visa laddningsindikator när data hämtas', async () => {
    // Sätt laddningstillstånd
    mockUseUserWithStandardHook.mockImplementation(() => ({
      getUser: {
        data: null,
        isLoading: true,
        error: null,
        execute: jest.fn(),
        retry: jest.fn()
      }
    }));
    
    renderScreen();
    
    // Verifiera att en laddningsindikator visas
    await waitFor(() => {
      expect(screen.getByText('Laddar profil...')).toBeTruthy();
    });
  });
  
  it('bör hantera felresultat korrekt', async () => {
    // Sätt fel
    const testError = new Error('Kunde inte hämta användardata');
    mockUseUserWithStandardHook.mockImplementation(() => ({
      getUser: {
        data: null,
        isLoading: false,
        error: testError,
        execute: jest.fn(),
        retry: jest.fn()
      }
    }));
    
    renderScreen();
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta användardata')).toBeTruthy();
    });
  });
  
  it('bör öppna redigeringsläge när användaren klickar på redigera-knappen', async () => {
    renderScreen();
    
    // Hitta och klicka på redigera-knappen
    await waitFor(async () => {
      const editButton = screen.getByText('Redigera profil');
      fireEvent.press(editButton);
    });
    
    // Verifiera att redigeringsläge visas
    await waitFor(() => {
      expect(screen.getByText('Spara ändringar')).toBeTruthy();
      expect(screen.getByText('Avbryt')).toBeTruthy();
    });
  });
  
  it('bör uppdatera profilinformation när användaren sparar ändringar', async () => {
    const updateProfileMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { 
        ...mockUser.profile,
        firstName: 'Updated',
        lastName: 'Name',
        displayName: 'Updated Name',
        bio: 'Updated bio'
      } 
    });
    
    mockUseUpdateProfile.mockImplementation(() => ({
      updateProfile: {
        execute: updateProfileMock,
        isLoading: false,
        error: null
      },
      updateAvatar: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateSocialLinks: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på redigera-knappen
    await waitFor(async () => {
      const editButton = screen.getByText('Redigera profil');
      fireEvent.press(editButton);
    });
    
    // Ändra värden i formuläret
    await waitFor(async () => {
      // Hitta och uppdatera namn-fältet
      const firstNameInput = screen.getByDisplayValue('Test');
      fireEvent.changeText(firstNameInput, 'Updated');
      
      const lastNameInput = screen.getByDisplayValue('User');
      fireEvent.changeText(lastNameInput, 'Name');
      
      // Hitta och uppdatera bio-fältet
      const bioInput = screen.getByDisplayValue('This is a test bio');
      fireEvent.changeText(bioInput, 'Updated bio');
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updateProfile anropades med rätt parametrar
    expect(updateProfileMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      profileData: {
        firstName: 'Updated',
        lastName: 'Name',
        displayName: 'Updated Name',
        bio: 'Updated bio',
        location: 'Stockholm',
        jobTitle: 'Developer',
        company: 'Test Company',
        phoneNumber: '+46701234567'
      }
    });
  });
  
  it('bör uppdatera avatarbild när användaren väljer en ny bild', async () => {
    const updateAvatarMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { avatarUrl: 'https://example.com/new-avatar.jpg' } 
    });
    
    mockUseUpdateProfile.mockImplementation(() => ({
      updateProfile: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateAvatar: {
        execute: updateAvatarMock,
        isLoading: false,
        error: null
      },
      updateSocialLinks: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på avatar-bilden för att byta bild
    await waitFor(async () => {
      const avatarImage = screen.getByTestId('avatar-image');
      fireEvent.press(avatarImage);
    });
    
    // Simulera att en fil har valts (detta är en förenkling, i verkligheten skulle vi behöva mocka ImagePicker)
    // Mock bildväljar-resultat
    const mockImageResult = {
      uri: 'file:///mock/path/to/image.jpg',
      width: 500,
      height: 500,
      type: 'image/jpeg'
    };
    
    // Hitta och klicka på bekräfta-knappen i bildväljardialogrutan
    await waitFor(async () => {
      const confirmButton = screen.getByText('Bekräfta bild');
      fireEvent.press(confirmButton);
    });
    
    // Verifiera att updateAvatar anropades med rätt parametrar
    expect(updateAvatarMock).toHaveBeenCalled();
    // Observera att vi inte kan validera exakta parametrar eftersom det beror på ImagePicker-implementationen
  });
  
  it('bör visa felmeddelande vid misslyckad profiluppdatering', async () => {
    const updateProfileMock = jest.fn().mockResolvedValue({ 
      isOk: () => false, 
      error: 'Kunde inte uppdatera profilen' 
    });
    
    mockUseUpdateProfile.mockImplementation(() => ({
      updateProfile: {
        execute: updateProfileMock,
        isLoading: false,
        error: null
      },
      updateAvatar: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateSocialLinks: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på redigera-knappen
    await waitFor(async () => {
      const editButton = screen.getByText('Redigera profil');
      fireEvent.press(editButton);
    });
    
    // Ändra värden i formuläret
    await waitFor(async () => {
      const bioInput = screen.getByDisplayValue('This is a test bio');
      fireEvent.changeText(bioInput, 'Updated bio');
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte uppdatera profilen')).toBeTruthy();
    });
  });
  
  it('bör återställa ändringar när användaren klickar på avbryt', async () => {
    const updateProfileMock = jest.fn();
    
    mockUseUpdateProfile.mockImplementation(() => ({
      updateProfile: {
        execute: updateProfileMock,
        isLoading: false,
        error: null
      },
      updateAvatar: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateSocialLinks: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på redigera-knappen
    await waitFor(async () => {
      const editButton = screen.getByText('Redigera profil');
      fireEvent.press(editButton);
    });
    
    // Ändra värden i formuläret
    await waitFor(async () => {
      const bioInput = screen.getByDisplayValue('This is a test bio');
      fireEvent.changeText(bioInput, 'Updated bio that should be discarded');
    });
    
    // Hitta och klicka på avbryt-knappen
    await waitFor(async () => {
      const cancelButton = screen.getByText('Avbryt');
      fireEvent.press(cancelButton);
    });
    
    // Verifiera att updateProfile inte anropades
    expect(updateProfileMock).not.toHaveBeenCalled();
    
    // Verifiera att profilen återställdes till ursprungligt tillstånd
    await waitFor(() => {
      expect(screen.getByText('This is a test bio')).toBeTruthy();
    });
  });
  
  it('bör uppdatera sociala länkar när användaren sparar ändringar', async () => {
    const updateSocialLinksMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { 
        linkedin: 'https://linkedin.com/in/updateduser',
        twitter: 'https://twitter.com/updateduser',
        github: 'https://github.com/testuser'
      } 
    });
    
    mockUseUpdateProfile.mockImplementation(() => ({
      updateProfile: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateAvatar: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateSocialLinks: {
        execute: updateSocialLinksMock,
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på redigera-knappen
    await waitFor(async () => {
      const editButton = screen.getByText('Redigera profil');
      fireEvent.press(editButton);
    });
    
    // Hitta och klicka på "Redigera sociala länkar"
    await waitFor(async () => {
      const socialLinksButton = screen.getByText('Sociala länkar');
      fireEvent.press(socialLinksButton);
    });
    
    // Ändra värden i sociala länkar-formuläret
    await waitFor(async () => {
      const linkedinInput = screen.getByDisplayValue('https://linkedin.com/in/testuser');
      fireEvent.changeText(linkedinInput, 'https://linkedin.com/in/updateduser');
      
      const twitterInput = screen.getByDisplayValue('https://twitter.com/testuser');
      fireEvent.changeText(twitterInput, 'https://twitter.com/updateduser');
    });
    
    // Hitta och klicka på spara-knappen för sociala länkar
    await waitFor(async () => {
      const saveSocialLinksButton = screen.getByText('Spara länkar');
      fireEvent.press(saveSocialLinksButton);
    });
    
    // Hitta och klicka på den övergripande spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updateSocialLinks anropades med rätt parametrar
    expect(updateSocialLinksMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/updateduser',
        twitter: 'https://twitter.com/updateduser',
        github: 'https://github.com/testuser'
      }
    });
  });
}); 