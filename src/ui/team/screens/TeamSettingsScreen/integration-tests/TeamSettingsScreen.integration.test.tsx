import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamSettingsScreenContainer } from '../TeamSettingsScreenContainer';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamSettings } from '@/application/team/hooks/useTeamSettings';
import { TeamVisibility } from '@/domain/team/value-objects/TeamSettings';

// Mocka hooks
jest.mock('@/application/team/hooks/useTeamSettings');
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn()
  }),
  useLocalSearchParams: () => ({
    teamId: 'test-team-id'
  })
}));

describe('TeamSettingsScreen Integration Test', () => {
  // Skapa mock-data
  const mockTeam = {
    id: 'test-team-id',
    name: 'Test Team',
    description: 'Team for testing',
    members: [
      { id: 'user-1', name: 'User 1', email: 'user1@example.com', role: 'admin' },
      { id: 'user-2', name: 'User 2', email: 'user2@example.com', role: 'member' }
    ],
    settings: {
      visibility: 'private',
      maxMembers: 10,
      allowInvites: true,
      notificationSettings: {
        activities: true,
        messages: true,
        memberChanges: true
      },
      automaticArchiving: false
    }
  };
  
  const mockUseTeamSettings = useTeamSettings as jest.Mock;
  const mockUseTeamWithStandardHook = useTeamWithStandardHook as jest.Mock;
  
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
    
    // Mocka useTeamWithStandardHook
    mockUseTeamWithStandardHook.mockImplementation(() => ({
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: mockTeam }),
        retry: jest.fn()
      },
      updateTeam: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
        isLoading: false,
        error: null
      }
    }));
    
    // Mocka useTeamSettings
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: mockTeam.settings,
      isLoading: false,
      error: null,
      updateSettings: jest.fn().mockResolvedValue({ 
        isOk: () => true, 
        value: { ...mockTeam.settings } 
      }),
      updateNotificationSettings: jest.fn().mockResolvedValue({ 
        isOk: () => true, 
        value: { ...mockTeam.settings.notificationSettings } 
      }),
      updatePrivacySettings: jest.fn().mockResolvedValue({ 
        isOk: () => true, 
        value: { visibility: mockTeam.settings.visibility } 
      })
    }));
  });
  
  // Renderings-hjälpfunktion
  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <TeamSettingsScreenContainer teamId="test-team-id" />
        </QueryClientProvider>
      </NavigationContainer>
    );
  };
  
  it('bör visa team-inställningar när data laddats framgångsrikt', async () => {
    renderScreen();
    
    // Verifiera att skärmen visar rätt team-namn
    await waitFor(() => {
      expect(screen.getByText(/Test Team - Inställningar/i)).toBeTruthy();
    });
    
    // Verifiera att inställningar visas
    expect(screen.getByText('Teamsynlighet')).toBeTruthy();
    expect(screen.getByText('Notifikationsinställningar')).toBeTruthy();
  });
  
  it('bör visa laddningsindikator när data hämtas', async () => {
    // Sätt laddningstillstånd
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: null,
      isLoading: true,
      error: null,
      updateSettings: jest.fn(),
      updateNotificationSettings: jest.fn(),
      updatePrivacySettings: jest.fn()
    }));
    
    mockUseTeamWithStandardHook.mockImplementation(() => ({
      getTeam: {
        data: null,
        isLoading: true,
        error: null,
        execute: jest.fn(),
        retry: jest.fn()
      },
      updateTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
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
    const testError = new Error('Kunde inte hämta team-inställningar');
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: null,
      isLoading: false,
      error: testError,
      updateSettings: jest.fn(),
      updateNotificationSettings: jest.fn(),
      updatePrivacySettings: jest.fn()
    }));
    
    renderScreen();
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta team-inställningar')).toBeTruthy();
    });
  });
  
  it('bör uppdatera teamvisibilitet när användaren ändrar inställningen', async () => {
    const updatePrivacySettingsMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { visibility: 'public' as TeamVisibility } 
    });
    
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: mockTeam.settings,
      isLoading: false,
      error: null,
      updateSettings: jest.fn(),
      updateNotificationSettings: jest.fn(),
      updatePrivacySettings: updatePrivacySettingsMock
    }));
    
    renderScreen();
    
    // Hitta och klicka på synlighetsinställning
    await waitFor(async () => {
      const visibilityToggle = screen.getByText('Privat');
      fireEvent.press(visibilityToggle);
    });
    
    // Hitta och klicka på alternativet "Publik"
    await waitFor(async () => {
      const publicOption = screen.getByText('Publik');
      fireEvent.press(publicOption);
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updatePrivacySettings anropades med rätt parametrar
    expect(updatePrivacySettingsMock).toHaveBeenCalledWith({
      teamId: 'test-team-id',
      visibility: 'public'
    });
  });
  
  it('bör uppdatera notifikationsinställningar när användaren ändrar dem', async () => {
    const updateNotificationSettingsMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { 
        activities: true,
        messages: false,
        memberChanges: true
      } 
    });
    
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: mockTeam.settings,
      isLoading: false,
      error: null,
      updateSettings: jest.fn(),
      updateNotificationSettings: updateNotificationSettingsMock,
      updatePrivacySettings: jest.fn()
    }));
    
    renderScreen();
    
    // Hitta och klicka på notifikationsinställningar-sektionen
    await waitFor(async () => {
      const notificationSection = screen.getByText('Notifikationsinställningar');
      fireEvent.press(notificationSection);
    });
    
    // Hitta och klicka på meddelande-notifikationer för att stänga av dem
    await waitFor(async () => {
      const messageToggle = screen.getByText('Notifikationer för meddelanden');
      fireEvent.press(messageToggle);
    });
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att updateNotificationSettings anropades med rätt parametrar
    expect(updateNotificationSettingsMock).toHaveBeenCalledWith({
      teamId: 'test-team-id',
      notificationSettings: {
        activities: true,
        messages: false, // Ändrat från true till false
        memberChanges: true
      }
    });
  });
  
  it('bör visa bekräftelsedialog vid större ändringar', async () => {
    renderScreen();
    
    // Hitta och klicka på automatisk arkivering
    await waitFor(async () => {
      const archivingToggle = screen.getByText('Automatisk arkivering');
      fireEvent.press(archivingToggle);
    });
    
    // Verifiera att bekräftelsedialog visas
    await waitFor(() => {
      expect(screen.getByText('Bekräfta ändring')).toBeTruthy();
      expect(screen.getByText('Vill du verkligen aktivera automatisk arkivering?')).toBeTruthy();
    });
    
    // Klicka på bekräfta
    fireEvent.press(screen.getByText('Bekräfta'));
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
  });
  
  it('bör visa felmeddelande vid misslyckad uppdatering', async () => {
    const updateSettingsMock = jest.fn().mockResolvedValue({ 
      isOk: () => false, 
      error: 'Kunde inte uppdatera inställningar på grund av otillräckliga behörigheter' 
    });
    
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: mockTeam.settings,
      isLoading: false,
      error: null,
      updateSettings: updateSettingsMock,
      updateNotificationSettings: jest.fn(),
      updatePrivacySettings: jest.fn()
    }));
    
    renderScreen();
    
    // Hitta och klicka på maxMembers-inställningen
    await waitFor(async () => {
      const maxMembersField = screen.getByText('Maximalt antal medlemmar');
      fireEvent.press(maxMembersField);
    });
    
    // Ändra värde
    fireEvent.changeText(screen.getByDisplayValue('10'), '20');
    
    // Hitta och klicka på spara-knappen
    await waitFor(async () => {
      const saveButton = screen.getByText('Spara ändringar');
      fireEvent.press(saveButton);
    });
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte uppdatera inställningar på grund av otillräckliga behörigheter')).toBeTruthy();
    });
  });
  
  it('bör återställa ändringar när användaren klickar på avbryt', async () => {
    const updateSettingsMock = jest.fn();
    
    mockUseTeamSettings.mockImplementation(() => ({
      teamSettings: mockTeam.settings,
      isLoading: false,
      error: null,
      updateSettings: updateSettingsMock,
      updateNotificationSettings: jest.fn(),
      updatePrivacySettings: jest.fn()
    }));
    
    renderScreen();
    
    // Hitta och klicka på tillåt inbjudningar
    await waitFor(async () => {
      const invitesToggle = screen.getByText('Tillåt inbjudningar');
      fireEvent.press(invitesToggle);
    });
    
    // Hitta och klicka på avbryt-knappen
    await waitFor(async () => {
      const cancelButton = screen.getByText('Avbryt');
      fireEvent.press(cancelButton);
    });
    
    // Verifiera att updateSettings inte anropades
    expect(updateSettingsMock).not.toHaveBeenCalled();
    
    // Verifiera att inställningen återställdes
    await waitFor(() => {
      // Vi förväntar oss att UI har återställts till det ursprungliga tillståndet
      expect(screen.getByText('Tillåt inbjudningar')).toBeTruthy();
    });
  });
}); 