import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamActivitiesScreenContainer } from '../TeamActivitiesScreenContainer';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { Result } from '@/shared/core/Result';
import { format } from 'date-fns';

// Mock beroenden
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ teamId: 'team-123' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

// Mock React Native komponenter
jest.mock('react-native-paper', () => ({
  ActivityIndicator: () => <div data-testid="loading-indicator" />,
  Appbar: {
    Header: ({ children }: any) => <div data-testid="appbar-header">{children}</div>,
    BackAction: ({ onPress }: any) => <button data-testid="back-button" onClick={onPress}>Back</button>,
    Content: ({ title }: any) => <div data-testid="appbar-title">{title}</div>,
    Action: ({ icon, onPress }: any) => <button data-testid={`action-${icon}`} onClick={onPress}>{icon}</button>,
  },
  Chip: ({ children, onPress, selected, testID }: any) => (
    <button 
      data-testid={testID || `chip-${children}`} 
      onClick={onPress}
      style={{ backgroundColor: selected ? 'blue' : 'gray' }}
    >
      {children}
    </button>
  ),
  Searchbar: ({ placeholder, value, onChangeText, testID }: any) => (
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value} 
      onChange={(e) => onChangeText(e.target.value)} 
      data-testid={testID || 'searchbar'}
    />
  ),
  Menu: {
    Item: ({ title, onPress }: any) => (
      <div data-testid={`menu-item-${title}`} onClick={onPress}>{title}</div>
    ),
  },
  Text: ({ children }: any) => <span>{children}</span>,
  Divider: () => <hr />,
}));

// Mock FlatList
jest.mock('react-native', () => {
  const original = jest.requireActual('react-native');
  return {
    ...original,
    FlatList: ({ data, renderItem, keyExtractor, testID }: any) => (
      <div data-testid={testID || 'flat-list'}>
        {data.map((item: any) => (
          <div key={keyExtractor(item)} data-testid={`activity-item-${item.id}`}>
            {renderItem({ item })}
          </div>
        ))}
      </div>
    ),
  };
});

describe('TeamActivitiesScreen Integration Tests', () => {
  // Skapa ny QueryClient för varje test
  let queryClient: QueryClient;
  
  // Mock-implementation av useTeamWithStandardHook
  const mockGetTeamActivities = jest.fn();
  const mockGetTeam = jest.fn();
  
  // Mock-data
  const mockTeamId = 'team-123';
  const mockTeam = {
    id: mockTeamId,
    name: 'Test Team',
    description: 'Test Team Description',
  };
  
  // Dagens datum för filtertester
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Formaterade datum för jämförelse
  const todayFormatted = format(today, 'yyyy-MM-dd');
  const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
  const lastWeekFormatted = format(lastWeek, 'yyyy-MM-dd');
  
  // Mock aktivitetsdata
  const mockActivities = [
    {
      id: 'activity-1',
      type: 'message',
      title: 'Nytt meddelande',
      description: 'Användare skrev ett nytt meddelande',
      createdAt: todayFormatted,
      createdBy: 'user-1',
      createdByName: 'Användare 1',
    },
    {
      id: 'activity-2',
      type: 'member_joined',
      title: 'Ny medlem',
      description: 'En ny användare har gått med i teamet',
      createdAt: yesterdayFormatted,
      createdBy: 'user-2',
      createdByName: 'Användare 2',
    },
    {
      id: 'activity-3',
      type: 'role_changed',
      title: 'Roll ändrad',
      description: 'En användares roll har ändrats',
      createdAt: lastWeekFormatted,
      createdBy: 'user-3',
      createdByName: 'Användare 3',
    },
    {
      id: 'activity-4',
      type: 'message',
      title: 'Ännu ett meddelande',
      description: 'En annan användare skrev ett meddelande',
      createdAt: lastWeekFormatted,
      createdBy: 'user-4',
      createdByName: 'Användare 4',
    },
  ];
  
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
    
    // Konfigurera useTeamWithStandardHook mock
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamActivities: {
        data: mockActivities,
        isLoading: false,
        error: null,
        execute: mockGetTeamActivities,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: mockGetTeam,
      },
    });
  });
  
  it('laddar och visar alla teamaktiviteter', async () => {
    // Rendera komponenten med QueryClient-provider
    const { getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att getTeamActivities anropas med korrekt teamId
    expect(mockGetTeamActivities).toHaveBeenCalledWith({ teamId: mockTeamId });
    
    // Verifiera att alla aktiviteter visas
    const activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(4);
  });
  
  it('filtrerar aktiviteter efter typ', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Klicka på message-filtret
    const messageFilterChip = getByTestId('filter-chip-message');
    await act(async () => {
      fireEvent.click(messageFilterChip);
    });
    
    // Kontrollera att bara meddelande-aktiviteter visas
    const activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(2); // activity-1 och activity-4 är meddelanden
    expect(getByTestId('activity-item-activity-1')).toBeTruthy();
    expect(getByTestId('activity-item-activity-4')).toBeTruthy();
  });
  
  it('filtrerar aktiviteter efter datum', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Klicka på filter för dagens datum
    const todayFilterChip = getByTestId('date-filter-chip-today');
    await act(async () => {
      fireEvent.click(todayFilterChip);
    });
    
    // Kontrollera att bara dagens aktiviteter visas
    const activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(1); // Bara activity-1 är från idag
    expect(getByTestId('activity-item-activity-1')).toBeTruthy();
  });
  
  it('kombinerar filtertyper för aktiviteter', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Klicka på message-filtret
    const messageFilterChip = getByTestId('filter-chip-message');
    await act(async () => {
      fireEvent.click(messageFilterChip);
    });
    
    // Klicka på filter för senaste veckan
    const weekFilterChip = getByTestId('date-filter-chip-week');
    await act(async () => {
      fireEvent.click(weekFilterChip);
    });
    
    // Kontrollera att bara meddelande-aktiviteter från senaste veckan visas
    const activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(1); // Bara activity-4 är ett meddelande från senaste veckan
    expect(getByTestId('activity-item-activity-4')).toBeTruthy();
  });
  
  it('söker efter aktiviteter baserat på text', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Skriv i sökfältet
    const searchbar = getByTestId('searchbar');
    await act(async () => {
      fireEvent.change(searchbar, { target: { value: 'ny medlem' } });
    });
    
    // Kontrollera att bara aktiviteter som matchar söktexten visas
    const activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(1); // Bara activity-2 innehåller "ny medlem"
    expect(getByTestId('activity-item-activity-2')).toBeTruthy();
  });
  
  it('visar laddningsindikator när data hämtas', async () => {
    // Konfigurera loading state
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamActivities: {
        data: null,
        isLoading: true,
        error: null,
        execute: mockGetTeamActivities,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: mockGetTeam,
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('visar felmeddelande när datahämtning misslyckas', async () => {
    // Konfigurera error state
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamActivities: {
        data: null,
        isLoading: false,
        error: { message: 'Kunde inte hämta teamaktiviteter' },
        execute: mockGetTeamActivities,
      },
      getTeam: {
        data: mockTeam,
        isLoading: false,
        error: null,
        execute: mockGetTeam,
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Verifiera att felmeddelande visas
    expect(getByTestId('error-message')).toBeTruthy();
  });
  
  it('återställer filter när återställningsknappen klickas', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Klicka på message-filtret
    const messageFilterChip = getByTestId('filter-chip-message');
    await act(async () => {
      fireEvent.click(messageFilterChip);
    });
    
    // Verifiera att filtret tillämpas
    let activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(2); // Bara meddelande-aktiviteter
    
    // Klicka på återställningsknappen
    const resetButton = getByTestId('reset-filters-button');
    await act(async () => {
      fireEvent.click(resetButton);
    });
    
    // Verifiera att alla aktiviteter visas igen
    activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(4); // Alla aktiviteter
  });
  
  it('kombinerar sökning med filtertyper', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamActivitiesScreenContainer />
      </QueryClientProvider>
    );
    
    // Klicka på message-filtret
    const messageFilterChip = getByTestId('filter-chip-message');
    await act(async () => {
      fireEvent.click(messageFilterChip);
    });
    
    // Skriv i sökfältet
    const searchbar = getByTestId('searchbar');
    await act(async () => {
      fireEvent.change(searchbar, { target: { value: 'annan' } });
    });
    
    // Kontrollera att bara meddelande-aktiviteter som matchar söktexten visas
    const activityItems = getAllByTestId(/activity-item/);
    expect(activityItems).toHaveLength(1); // Bara activity-4 är ett meddelande som innehåller "annan"
    expect(getByTestId('activity-item-activity-4')).toBeTruthy();
  });
}); 