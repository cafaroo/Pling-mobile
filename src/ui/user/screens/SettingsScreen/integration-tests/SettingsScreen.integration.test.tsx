import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsScreenContainer } from '../SettingsScreenContainer';
import { useUserSettings } from '@/application/user/hooks/useUserSettings';
import { useUpdateSettings } from '@/application/user/hooks/useUpdateSettings';

// Mocka hooks
jest.mock('@/application/user/hooks/useUserSettings');
jest.mock('@/application/user/hooks/useUpdateSettings');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn()
  }),
  useLocalSearchParams: () => ({
    userId: 'current-user-id'
  })
}));

describe('SettingsScreen Integration Test', () => {
  // Skapa mock-data
  const mockSettings = {
    language: 'sv',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      teamUpdates: true,
      mentionNotifications: true,
      dailySummary: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      activityVisibility: 'team'
    },
    preferences: {
      autoSaveIntervalSeconds: 60,
      defaultView: 'list',
      useCompactMode: false,
      enableAnimations: true,
      enableSounds: true
    }
  };
  
  const mockUseUserSettings = useUserSettings as jest.Mock;
  const mockUseUpdateSettings = useUpdateSettings as jest.Mock;
  
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
    
    // Mocka useUserSettings
    mockUseUserSettings.mockImplementation(() => ({
      settings: {
        data: mockSettings,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      }
    }));
    
    // Mocka useUpdateSettings
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { language: 'sv' } }),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { theme: 'dark' } }),
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { ...mockSettings.notifications } }),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { ...mockSettings.privacy } }),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { ...mockSettings.preferences } }),
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
          <SettingsScreenContainer userId="current-user-id" />
        </QueryClientProvider>
      </NavigationContainer>
    );
  };
  
  it('bör visa användarinställningar när data laddats framgångsrikt', async () => {
    renderScreen();
    
    // Verifiera att skärmen visar inställningar
    await waitFor(() => {
      expect(screen.getByText('Inställningar')).toBeTruthy();
    });
    
    // Verifiera att språkinställningar visas
    expect(screen.getByText('Språk')).toBeTruthy();
    expect(screen.getByText('Svenska')).toBeTruthy();
    
    // Verifiera att temainställningar visas
    expect(screen.getByText('Tema')).toBeTruthy();
    expect(screen.getByText('Ljust')).toBeTruthy();
    
    // Verifiera att notifikationsinställningar visas
    expect(screen.getByText('Notifikationer')).toBeTruthy();
  });
  
  it('bör visa laddningsindikator när data hämtas', async () => {
    // Sätt laddningstillstånd
    mockUseUserSettings.mockImplementation(() => ({
      settings: {
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn()
      }
    }));
    
    renderScreen();
    
    // Verifiera att en laddningsindikator visas
    await waitFor(() => {
      expect(screen.getByText('Laddar inställningar...')).toBeTruthy();
    });
  });
  
  it('bör hantera felresultat korrekt', async () => {
    // Sätt fel
    const testError = new Error('Kunde inte hämta användarinställningar');
    mockUseUserSettings.mockImplementation(() => ({
      settings: {
        data: null,
        isLoading: false,
        error: testError,
        refetch: jest.fn()
      }
    }));
    
    renderScreen();
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta användarinställningar')).toBeTruthy();
    });
    
    // Verifiera att försök igen-knapp visas
    expect(screen.getByText('Försök igen')).toBeTruthy();
  });
  
  it('bör uppdatera språkinställning när användaren ändrar språk', async () => {
    const updateLanguageMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { language: 'en' } 
    });
    
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: updateLanguageMock,
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på språkinställning
    await waitFor(async () => {
      const languageItem = screen.getByText('Språk');
      fireEvent.press(languageItem);
    });
    
    // Hitta och välj engelska
    await waitFor(async () => {
      const englishOption = screen.getByText('Engelska');
      fireEvent.press(englishOption);
    });
    
    // Verifiera att updateLanguage anropades med rätt parametrar
    expect(updateLanguageMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      language: 'en'
    });
  });
  
  it('bör uppdatera tema när användaren ändrar temainställning', async () => {
    const updateThemeMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { theme: 'dark' } 
    });
    
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: updateThemeMock,
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på temainställning
    await waitFor(async () => {
      const themeItem = screen.getByText('Tema');
      fireEvent.press(themeItem);
    });
    
    // Hitta och välj mörkt tema
    await waitFor(async () => {
      const darkThemeOption = screen.getByText('Mörkt');
      fireEvent.press(darkThemeOption);
    });
    
    // Verifiera att updateTheme anropades med rätt parametrar
    expect(updateThemeMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      theme: 'dark'
    });
  });
  
  it('bör uppdatera notifikationsinställningar när användaren ändrar dem', async () => {
    const updateNotificationSettingsMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { 
        email: true,
        push: false, // Ändrat från true till false
        teamUpdates: true,
        mentionNotifications: true,
        dailySummary: false
      } 
    });
    
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: updateNotificationSettingsMock,
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på notifikationsinställningar
    await waitFor(async () => {
      const notificationsItem = screen.getByText('Notifikationer');
      fireEvent.press(notificationsItem);
    });
    
    // Hitta och stäng av pushnotifikationer
    await waitFor(async () => {
      const pushToggle = screen.getByText('Push-notifikationer');
      fireEvent.press(pushToggle);
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updateNotificationSettings anropades med rätt parametrar
    expect(updateNotificationSettingsMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      notifications: {
        email: true,
        push: false,
        teamUpdates: true,
        mentionNotifications: true,
        dailySummary: false
      }
    });
  });
  
  it('bör uppdatera sekretessinställningar när användaren ändrar dem', async () => {
    const updatePrivacySettingsMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { 
        profileVisibility: 'private', // Ändrat från public till private
        showEmail: false,
        showPhone: false,
        activityVisibility: 'team'
      } 
    });
    
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: updatePrivacySettingsMock,
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på sekretessinställningar
    await waitFor(async () => {
      const privacyItem = screen.getByText('Sekretess');
      fireEvent.press(privacyItem);
    });
    
    // Hitta och ändra profilsynlighet
    await waitFor(async () => {
      const visibilityOption = screen.getByText('Profilens synlighet');
      fireEvent.press(visibilityOption);
      
      // Välj privat synlighet
      const privateOption = screen.getByText('Privat');
      fireEvent.press(privateOption);
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updatePrivacySettings anropades med rätt parametrar
    expect(updatePrivacySettingsMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      privacy: {
        profileVisibility: 'private',
        showEmail: false,
        showPhone: false,
        activityVisibility: 'team'
      }
    });
  });
  
  it('bör uppdatera användarpreferenser när användaren ändrar dem', async () => {
    const updatePreferencesMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { 
        autoSaveIntervalSeconds: 30, // Ändrat från 60 till 30
        defaultView: 'list',
        useCompactMode: true, // Ändrat från false till true
        enableAnimations: true,
        enableSounds: true
      } 
    });
    
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: updatePreferencesMock,
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på preferenser
    await waitFor(async () => {
      const preferencesItem = screen.getByText('Preferenser');
      fireEvent.press(preferencesItem);
    });
    
    // Ändra autosparintervall
    await waitFor(async () => {
      const autoSaveItem = screen.getByText('Intervall för automatiskt sparande');
      fireEvent.press(autoSaveItem);
      
      // Välj 30 sekunder
      const thirtySecondsOption = screen.getByText('30 sekunder');
      fireEvent.press(thirtySecondsOption);
    });
    
    // Aktivera kompakt läge
    await waitFor(async () => {
      const compactModeToggle = screen.getByText('Kompakt läge');
      fireEvent.press(compactModeToggle);
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updatePreferences anropades med rätt parametrar
    expect(updatePreferencesMock).toHaveBeenCalledWith({
      userId: 'current-user-id',
      preferences: {
        autoSaveIntervalSeconds: 30,
        defaultView: 'list',
        useCompactMode: true,
        enableAnimations: true,
        enableSounds: true
      }
    });
  });
  
  it('bör visa felmeddelande vid misslyckad uppdatering', async () => {
    const updateThemeMock = jest.fn().mockResolvedValue({ 
      isOk: () => false, 
      error: 'Kunde inte uppdatera tema' 
    });
    
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: updateThemeMock,
        isLoading: false,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på temainställning
    await waitFor(async () => {
      const themeItem = screen.getByText('Tema');
      fireEvent.press(themeItem);
    });
    
    // Hitta och välj mörkt tema
    await waitFor(async () => {
      const darkThemeOption = screen.getByText('Mörkt');
      fireEvent.press(darkThemeOption);
    });
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte uppdatera tema')).toBeTruthy();
    });
  });
  
  it('bör visa laddningsindikator under uppdatering', async () => {
    // Sätt laddningstillstånd för en av operationerna
    mockUseUpdateSettings.mockImplementation(() => ({
      updateLanguage: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updateTheme: {
        execute: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ isOk: () => true, value: { theme: 'dark' } }), 500))),
        isLoading: true,
        error: null
      },
      updateNotificationSettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePrivacySettings: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      updatePreferences: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på temainställning
    await waitFor(async () => {
      const themeItem = screen.getByText('Tema');
      fireEvent.press(themeItem);
    });
    
    // Hitta och välj mörkt tema
    await waitFor(async () => {
      const darkThemeOption = screen.getByText('Mörkt');
      fireEvent.press(darkThemeOption);
    });
    
    // Verifiera att laddningsindikator visas
    await waitFor(() => {
      expect(screen.getByTestId('theme-loading-indicator')).toBeTruthy();
    });
  });
  
  it('bör återställa ändringar i formulär när användaren klickar på avbryt', async () => {
    renderScreen();
    
    // Hitta och klicka på notifikationsinställningar
    await waitFor(async () => {
      const notificationsItem = screen.getByText('Notifikationer');
      fireEvent.press(notificationsItem);
    });
    
    // Hitta och stäng av pushnotifikationer
    await waitFor(async () => {
      const pushToggle = screen.getByText('Push-notifikationer');
      fireEvent.press(pushToggle);
    });
    
    // Hitta och klicka på avbryt-knappen
    await waitFor(async () => {
      const cancelButton = screen.getByText('Avbryt');
      fireEvent.press(cancelButton);
    });
    
    // Öppna notifikationsinställningar igen för att kontrollera att ändringarna återställts
    await waitFor(async () => {
      const notificationsItem = screen.getByText('Notifikationer');
      fireEvent.press(notificationsItem);
    });
    
    // Verifiera att push-notifikationer fortfarande är på (återställd)
    await waitFor(() => {
      // Hitta togglen och kontrollera dess status
      const pushToggle = screen.getByTestId('push-toggle');
      expect(pushToggle.props.value).toBeTruthy();
    });
  });
}); 