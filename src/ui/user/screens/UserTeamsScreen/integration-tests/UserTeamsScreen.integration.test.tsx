import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserTeamsScreenContainer } from '../UserTeamsScreenContainer';
import { useUserTeams } from '@/application/user/hooks/useUserTeams';

// Mocka hooks
jest.mock('@/application/user/hooks/useUserTeams');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useLocalSearchParams: () => ({
    userId: 'current-user-id'
  })
}));

describe('UserTeamsScreen Integration Test', () => {
  // Skapa mock-data
  const mockTeams = [
    {
      id: 'team-1',
      name: 'Utvecklingsteamet',
      description: 'Frontend och backend utveckling',
      memberCount: 8,
      role: 'admin',
      avatarUrl: 'https://example.com/team1.jpg',
      lastActivity: '2023-06-10T10:30:00.000Z'
    },
    {
      id: 'team-2',
      name: 'Designteamet',
      description: 'UX och UI design',
      memberCount: 5,
      role: 'member',
      avatarUrl: 'https://example.com/team2.jpg',
      lastActivity: '2023-06-09T14:20:00.000Z'
    },
    {
      id: 'team-3',
      name: 'Projektledning',
      description: 'Projektkoordinering och planering',
      memberCount: 3,
      role: 'member',
      avatarUrl: 'https://example.com/team3.jpg',
      lastActivity: '2023-06-08T09:15:00.000Z'
    }
  ];
  
  const mockUseUserTeams = useUserTeams as jest.Mock;
  
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
    
    // Mocka useUserTeams
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        filter: jest.fn(),
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: { id: 'new-team-id' } }),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn().mockResolvedValue({ isOk: () => true, value: true }),
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
          <UserTeamsScreenContainer userId="current-user-id" />
        </QueryClientProvider>
      </NavigationContainer>
    );
  };
  
  it('bör visa användarens team när data laddats framgångsrikt', async () => {
    renderScreen();
    
    // Verifiera att skärmen visar teamnamn för alla team
    await waitFor(() => {
      expect(screen.getByText('Utvecklingsteamet')).toBeTruthy();
      expect(screen.getByText('Designteamet')).toBeTruthy();
      expect(screen.getByText('Projektledning')).toBeTruthy();
    });
    
    // Verifiera att beskrivningar visas
    expect(screen.getByText('Frontend och backend utveckling')).toBeTruthy();
    expect(screen.getByText('UX och UI design')).toBeTruthy();
    expect(screen.getByText('Projektkoordinering och planering')).toBeTruthy();
    
    // Verifiera att roller visas
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getAllByText('Medlem').length).toBeGreaterThanOrEqual(2);
  });
  
  it('bör visa laddningsindikator när data hämtas', async () => {
    // Sätt laddningstillstånd
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: null,
        isLoading: true,
        error: null,
        filter: jest.fn(),
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Verifiera att en laddningsindikator visas
    await waitFor(() => {
      expect(screen.getByText('Laddar team...')).toBeTruthy();
    });
  });
  
  it('bör hantera felresultat korrekt', async () => {
    // Sätt fel
    const testError = new Error('Kunde inte hämta användarens team');
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: null,
        isLoading: false,
        error: testError,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: null,
        isLoading: false,
        error: testError,
        filter: jest.fn(),
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta användarens team')).toBeTruthy();
    });
    
    // Verifiera att en försök igen-knapp visas
    expect(screen.getByText('Försök igen')).toBeTruthy();
  });
  
  it('bör filtrera team baserat på sökterm', async () => {
    const filterMock = jest.fn().mockImplementation((searchTerm) => {
      // Enkel filtreringslogik för test
      if (searchTerm === 'design') {
        return mockTeams.filter(team => team.name.toLowerCase().includes('design'));
      }
      return mockTeams;
    });
    
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        filter: filterMock,
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta sökfältet och ange sökterm
    await waitFor(async () => {
      const searchInput = screen.getByPlaceholderText('Sök bland dina team');
      fireEvent.changeText(searchInput, 'design');
    });
    
    // Verifiera att filter-funktionen anropades med rätt term
    expect(filterMock).toHaveBeenCalledWith('design');
    
    // Uppdatera mock för att filtrera resultaten
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: [mockTeams[1]], // Endast designteamet
        isLoading: false,
        error: null,
        filter: filterMock,
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    // Rendera om komponenten (simulerar state-uppdatering)
    renderScreen();
    
    // Verifiera att endast designteamet visas
    await waitFor(() => {
      expect(screen.getByText('Designteamet')).toBeTruthy();
      expect(screen.queryByText('Utvecklingsteamet')).toBeNull();
      expect(screen.queryByText('Projektledning')).toBeNull();
    });
  });
  
  it('bör visa dialog för att skapa nytt team när användaren klickar på "Skapa team"-knappen', async () => {
    renderScreen();
    
    // Hitta och klicka på "Skapa team"-knappen
    await waitFor(async () => {
      const createTeamButton = screen.getByText('Skapa nytt team');
      fireEvent.press(createTeamButton);
    });
    
    // Verifiera att dialog för att skapa team visas
    await waitFor(() => {
      expect(screen.getByText('Skapa ett nytt team')).toBeTruthy();
      expect(screen.getByText('Teamnamn')).toBeTruthy();
      expect(screen.getByText('Beskrivning')).toBeTruthy();
    });
  });
  
  it('bör skapa ett nytt team när användaren fyller i formuläret och klickar på "Skapa"', async () => {
    const createTeamMock = jest.fn().mockResolvedValue({ 
      isOk: () => true, 
      value: { id: 'new-team-id', name: 'Nytt team', description: 'Teambeskrivning' }
    });
    
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        filter: jest.fn(),
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: createTeamMock,
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på "Skapa team"-knappen
    await waitFor(async () => {
      const createTeamButton = screen.getByText('Skapa nytt team');
      fireEvent.press(createTeamButton);
    });
    
    // Fyll i formuläret
    await waitFor(async () => {
      const nameInput = screen.getByPlaceholderText('Ange teamnamn');
      fireEvent.changeText(nameInput, 'Nytt team');
      
      const descriptionInput = screen.getByPlaceholderText('Beskriv teamet (valfritt)');
      fireEvent.changeText(descriptionInput, 'Teambeskrivning');
    });
    
    // Klicka på Skapa-knappen
    await waitFor(async () => {
      const createButton = screen.getByText('Skapa');
      fireEvent.press(createButton);
    });
    
    // Verifiera att createTeam anropades med rätt parametrar
    expect(createTeamMock).toHaveBeenCalledWith({
      name: 'Nytt team',
      description: 'Teambeskrivning',
      userId: 'current-user-id'
    });
  });
  
  it('bör visa bekräftelsedialog när användaren försöker lämna ett team', async () => {
    renderScreen();
    
    // Hitta och klicka på menyn för första teamet
    await waitFor(async () => {
      const teamMenu = screen.getAllByTestId('team-menu-button')[0];
      fireEvent.press(teamMenu);
    });
    
    // Klicka på "Lämna team" i menyn
    await waitFor(async () => {
      const leaveTeamOption = screen.getByText('Lämna team');
      fireEvent.press(leaveTeamOption);
    });
    
    // Verifiera att bekräftelsedialog visas
    await waitFor(() => {
      expect(screen.getByText('Bekräfta åtgärd')).toBeTruthy();
      expect(screen.getByText('Är du säker på att du vill lämna detta team?')).toBeTruthy();
      expect(screen.getByText('Avbryt')).toBeTruthy();
      expect(screen.getByText('Lämna')).toBeTruthy();
    });
  });
  
  it('bör lämna ett team när användaren bekräftar', async () => {
    const leaveTeamMock = jest.fn().mockResolvedValue({ isOk: () => true, value: true });
    
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: mockTeams,
        isLoading: false,
        error: null,
        filter: jest.fn(),
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: leaveTeamMock,
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Hitta och klicka på menyn för första teamet
    await waitFor(async () => {
      const teamMenu = screen.getAllByTestId('team-menu-button')[0];
      fireEvent.press(teamMenu);
    });
    
    // Klicka på "Lämna team" i menyn
    await waitFor(async () => {
      const leaveTeamOption = screen.getByText('Lämna team');
      fireEvent.press(leaveTeamOption);
    });
    
    // Klicka på "Lämna" i bekräftelsedialogen
    await waitFor(async () => {
      const confirmButton = screen.getByText('Lämna');
      fireEvent.press(confirmButton);
    });
    
    // Verifiera att leaveTeam anropades med rätt parametrar
    expect(leaveTeamMock).toHaveBeenCalledWith({
      teamId: 'team-1',
      userId: 'current-user-id'
    });
  });
  
  it('bör navigera till teamdetaljer när användaren klickar på ett team', async () => {
    const mockPush = jest.fn();
    jest.mock('expo-router', () => ({
      useRouter: () => ({
        push: mockPush,
        replace: jest.fn()
      }),
      useLocalSearchParams: () => ({
        userId: 'current-user-id'
      })
    }));
    
    renderScreen();
    
    // Hitta och klicka på ett team
    await waitFor(async () => {
      const teamItem = screen.getByText('Utvecklingsteamet');
      fireEvent.press(teamItem);
    });
    
    // Eftersom navigationsmetoder är mockade, kan vi inte direkt testa navigation
    // Detta är ett mer begränsat test eftersom vi inte kan verifiera navigation fullt ut
    // För en fullständig testning skulle vi behöva en mer komplex mockningsstrategi för navigation
  });
  
  it('bör visa "Inga team" när användaren inte tillhör några team', async () => {
    mockUseUserTeams.mockImplementation(() => ({
      teams: {
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn()
      },
      filteredTeams: {
        data: [],
        isLoading: false,
        error: null,
        filter: jest.fn(),
        resetFilters: jest.fn()
      },
      createTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      },
      leaveTeam: {
        execute: jest.fn(),
        isLoading: false,
        error: null
      }
    }));
    
    renderScreen();
    
    // Verifiera att tomt tillstånd visas
    await waitFor(() => {
      expect(screen.getByText('Inga team')).toBeTruthy();
      expect(screen.getByText('Du är inte medlem i något team ännu')).toBeTruthy();
    });
    
    // Verifiera att skapa-knapp visas även i tomt tillstånd
    expect(screen.getByText('Skapa nytt team')).toBeTruthy();
  });
}); 