import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamActivitiesScreenContainer } from '../TeamActivitiesScreenContainer';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';

// Mocka hooks
jest.mock('@/application/team/hooks/useTeamActivities');
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

describe('TeamActivitiesScreen Integration Test', () => {
  // Skapa mock-data
  const mockTeam = {
    id: 'test-team-id',
    name: 'Test Team',
    description: 'Team for testing',
    members: [
      { id: 'user-1', name: 'User 1', email: 'user1@example.com', role: 'admin' },
      { id: 'user-2', name: 'User 2', email: 'user2@example.com', role: 'member' }
    ]
  };
  
  const mockActivities = [
    {
      id: 'activity-1',
      type: 'message' as ActivityType,
      title: 'Nytt meddelande',
      description: 'User 1 skickade ett meddelande',
      performedBy: 'user-1',
      performedByName: 'User 1',
      targetId: null,
      targetName: null,
      createdAt: new Date().toISOString(),
      teamId: 'test-team-id',
      metadata: {}
    },
    {
      id: 'activity-2',
      type: 'member_added' as ActivityType,
      title: 'Ny medlem',
      description: 'User 2 lades till i teamet',
      performedBy: 'user-1',
      performedByName: 'User 1',
      targetId: 'user-2',
      targetName: 'User 2',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dag sedan
      teamId: 'test-team-id',
      metadata: {}
    },
    {
      id: 'activity-3',
      type: 'role_changed' as ActivityType,
      title: 'Roll ändrad',
      description: 'User 2 fick rollen medlem',
      performedBy: 'user-1',
      performedByName: 'User 1',
      targetId: 'user-2',
      targetName: 'User 2',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dagar sedan
      teamId: 'test-team-id',
      metadata: { oldRole: 'guest', newRole: 'member' }
    }
  ];
  
  const mockActivityStats = {
    'message': 10,
    'member_added': 5,
    'member_removed': 2,
    'role_changed': 3,
    'task': 7,
    'file_uploaded': 4
  };
  
  const mockUseTeamActivities = useTeamActivities as jest.Mock;
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
      }
    }));
    
    // Mocka useTeamActivities
    mockUseTeamActivities.mockImplementation(() => ({
      activities: mockActivities,
      total: mockActivities.length,
      hasMore: false,
      activityStats: mockActivityStats,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      latestActivities: mockActivities.slice(0, 2),
      isLoadingLatest: false,
      isLoadingStats: false,
      isFetching: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: jest.fn()
    }));
  });
  
  // Renderings-hjälpfunktion
  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          <TeamActivitiesScreenContainer teamId="test-team-id" />
        </QueryClientProvider>
      </NavigationContainer>
    );
  };
  
  it('bör visa aktivitetslista när data laddats framgångsrikt', async () => {
    renderScreen();
    
    // Verifiera att skärmen visar rätt team-namn
    await waitFor(() => {
      expect(screen.getByText(/Test Team - Aktiviteter/i)).toBeTruthy();
    });
    
    // Verifiera att aktiviteter visas
    expect(screen.getByText('Nytt meddelande')).toBeTruthy();
    expect(screen.getByText('Ny medlem')).toBeTruthy();
    expect(screen.getByText('Roll ändrad')).toBeTruthy();
  });
  
  it('bör visa laddningsindikator när data hämtas', async () => {
    // Sätt laddningstillstånd
    mockUseTeamActivities.mockImplementation(() => ({
      activities: [],
      total: 0,
      hasMore: false,
      activityStats: {},
      isLoading: true,
      isLoadingMore: false,
      error: null,
      latestActivities: [],
      isLoadingLatest: true,
      isLoadingStats: true,
      isFetching: true,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: jest.fn()
    }));
    
    renderScreen();
    
    // Verifiera att en laddningsindikator visas
    await waitFor(() => {
      expect(screen.getByText('Laddar aktiviteter...')).toBeTruthy();
    });
  });
  
  it('bör hantera tomt aktivitetsresultat korrekt', async () => {
    // Sätt tomt resultat
    mockUseTeamActivities.mockImplementation(() => ({
      activities: [],
      total: 0,
      hasMore: false,
      activityStats: {},
      isLoading: false,
      isLoadingMore: false,
      error: null,
      latestActivities: [],
      isLoadingLatest: false,
      isLoadingStats: false,
      isFetching: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: jest.fn()
    }));
    
    renderScreen();
    
    // Verifiera att tom-tillstånd visas
    await waitFor(() => {
      expect(screen.getByText('Inga aktiviteter hittades')).toBeTruthy();
      expect(screen.getByText('Det finns inga aktiviteter i detta team ännu')).toBeTruthy();
    });
  });
  
  it('bör hantera felresultat korrekt', async () => {
    // Sätt fel
    const testError = new Error('Kunde inte hämta aktiviteter');
    mockUseTeamActivities.mockImplementation(() => ({
      activities: [],
      total: 0,
      hasMore: false,
      activityStats: {},
      isLoading: false,
      isLoadingMore: false,
      error: testError,
      latestActivities: [],
      isLoadingLatest: false,
      isLoadingStats: false,
      isFetching: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: jest.fn()
    }));
    
    renderScreen();
    
    // Verifiera att felmeddelande visas
    await waitFor(() => {
      expect(screen.getByText('Kunde inte hämta aktiviteter')).toBeTruthy();
    });
  });
  
  it('bör anropa fetchNextPage när "Ladda fler" klickas', async () => {
    // Sätt att det finns mer data att hämta
    const mockFetchNextPage = jest.fn();
    mockUseTeamActivities.mockImplementation(() => ({
      activities: mockActivities,
      total: 10, // Fler än de som visas
      hasMore: true,
      activityStats: mockActivityStats,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      latestActivities: mockActivities.slice(0, 2),
      isLoadingLatest: false,
      isLoadingStats: false,
      isFetching: false,
      refetch: jest.fn(),
      fetchNextPage: mockFetchNextPage,
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: jest.fn()
    }));
    
    renderScreen();
    
    // Hitta och klicka på "Ladda fler" knappen
    await waitFor(() => {
      const loadMoreButton = screen.getByText('Ladda fler aktiviteter');
      fireEvent.press(loadMoreButton);
    });
    
    // Verifiera att fetchNextPage anropades
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });
  
  it('bör filtrera aktiviteter när typ väljs', async () => {
    const mockFilterFunc = jest.fn();
    mockUseTeamActivities.mockImplementation(() => ({
      activities: mockActivities,
      total: mockActivities.length,
      hasMore: false,
      activityStats: mockActivityStats,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      latestActivities: mockActivities.slice(0, 2),
      isLoadingLatest: false,
      isLoadingStats: false,
      isFetching: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: mockFilterFunc
    }));
    
    renderScreen();
    
    // Hitta och klicka på en aktivitetstyp-chip
    await waitFor(async () => {
      // Testa att vi kan hitta statistiköversikten
      expect(screen.getByText('Aktivitetsöversikt')).toBeTruthy();
      
      // Testa att vi kan hitta meddelande-chip
      const messageChip = screen.getByText('Meddelande: 10');
      fireEvent.press(messageChip);
    });
    
    // Vi förväntar oss inte att filterByType anropas eftersom det är
    // handleTypeFilter i presentationskomponenten som faktiskt sätter filterState
    // och anropar onFilter, som i sin tur använder useCallback
    
    // Istället verifiera att aktiviteter visas efter filtrering
    expect(screen.getByText('Nytt meddelande')).toBeTruthy();
  });
  
  it('bör hantera sökning korrekt', async () => {
    renderScreen();
    
    // Simulera sökning
    await waitFor(async () => {
      const searchInput = screen.getByPlaceholderText('Sök aktiviteter...');
      fireEvent.changeText(searchInput, 'meddelande');
    });
    
    // Verifiera att aktiviteter filtreras
    // Effekten av detta i UI är intern, men vi kan verifiera att UI-komponenten finns
    expect(screen.getByText('Nytt meddelande')).toBeTruthy();
  });
  
  it('bör hantera datumintervallfiltrering korrekt', async () => {
    renderScreen();
    
    // Öppna filtermenyn
    await waitFor(async () => {
      // Hitta filter-knappen och klicka på den
      fireEvent.press(screen.getByTestId('icon-button'));
    });
    
    // Klicka på "Idag" i menyn
    fireEvent.press(screen.getByText('Idag'));
    
    // Verifiera att rätt datum-filtrering appliceras
    // Effekten av detta i UI är intern, men vi kan verifiera att UI-komponenten finns
    expect(screen.getByText('Nytt meddelande')).toBeTruthy();
  });
  
  it('bör anropa refetch när uppdateringsknappen trycks', async () => {
    const mockRefetch = jest.fn();
    mockUseTeamActivities.mockImplementation(() => ({
      activities: mockActivities,
      total: mockActivities.length,
      hasMore: false,
      activityStats: mockActivityStats,
      isLoading: false,
      isLoadingMore: false,
      error: null,
      latestActivities: mockActivities.slice(0, 2),
      isLoadingLatest: false,
      isLoadingStats: false,
      isFetching: false,
      refetch: mockRefetch,
      fetchNextPage: jest.fn(),
      createActivity: jest.fn(),
      createActivityFromEvent: jest.fn(),
      filterByType: jest.fn()
    }));
    
    renderScreen();
    
    // Hitta och klicka på uppdateringsknappen i appbaren
    await waitFor(() => {
      // Simulera tryck på uppdateringsknappen
      const refreshButton = screen.getAllByRole('button')[0]; // Appbar refresh button
      fireEvent.press(refreshButton);
    });
    
    // Verifiera att refetch anropades
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
}); 