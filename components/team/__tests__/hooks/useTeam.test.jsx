import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTeam } from '../../../../hooks/useTeam';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { teamService } from '../../../../services/teamService';

// Mock för teamService
jest.mock('../../../../services/teamService', () => ({
  teamService: {
    getTeam: jest.fn(),
    getTeamMembers: jest.fn(),
    getTeamSubscription: jest.fn(),
    getCurrentUserRole: jest.fn()
  }
}));

// Mock för useAuth
jest.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user1' },
    isLoading: false,
    error: null
  })
}));

describe('useTeam', () => {
  // Skapa en wrapper för renderHook
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        }
      }
    });
    
    return ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Grundläggande mockar för framgångsrika anrop
    teamService.getTeam.mockResolvedValue({
      data: {
        id: 'team1',
        name: 'Testteam',
        description: 'En testbeskrivning',
        is_private: true,
        owner_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null,
      status: 'success'
    });
    
    teamService.getTeamMembers.mockResolvedValue({
      data: [
        {
          id: 'member1',
          user_id: 'user1',
          team_id: 'team1',
          role: 'owner',
          status: 'active',
          created_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          user: {
            id: 'user1',
            name: 'Teamägare',
            email: 'owner@example.com'
          }
        }
      ],
      error: null,
      status: 'success'
    });
    
    teamService.getTeamSubscription.mockResolvedValue({
      data: {
        id: 'sub1',
        team_id: 'team1',
        tier: 'basic',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      error: null,
      status: 'success'
    });
    
    teamService.getCurrentUserRole.mockResolvedValue({
      data: 'owner',
      error: null,
      status: 'success'
    });
  });
  
  it('laddar teamdata korrekt', async () => {
    const { result } = renderHook(() => useTeam('team1'), { wrapper: createWrapper() });
    
    // Initialt tillstånd
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.team).toBeNull();
    
    // Vänta på att hook-anropet ska slutföras
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Slutligt tillstånd
    expect(result.current.team).toEqual(expect.objectContaining({
      id: 'team1',
      name: 'Testteam'
    }));
    expect(result.current.members).toHaveLength(1);
    expect(result.current.currentUserRole).toBe('owner');
    expect(result.current.subscription).toEqual(expect.objectContaining({
      tier: 'basic',
      status: 'active'
    }));
    
    // Verifiera att tjänsteanropen gjordes korrekt
    expect(teamService.getTeam).toHaveBeenCalledWith('team1');
    expect(teamService.getTeamMembers).toHaveBeenCalledWith('team1');
    expect(teamService.getTeamSubscription).toHaveBeenCalledWith('team1');
    expect(teamService.getCurrentUserRole).toHaveBeenCalledWith('team1', 'user1');
  });
  
  it('hanterar fel från API', async () => {
    // Mockimplementation för att simulera ett fel
    teamService.getTeam.mockResolvedValue({
      data: null,
      error: 'Kunde inte hitta teamet',
      status: 'error'
    });
    
    const { result } = renderHook(() => useTeam('team1'), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBe('Kunde inte hitta teamet');
    expect(result.current.team).toBeNull();
  });
  
  it('omladdar data via refetch', async () => {
    const { result } = renderHook(() => useTeam('team1'), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Återställ mockar för att verifiera nya anrop
    teamService.getTeam.mockClear();
    teamService.getTeamMembers.mockClear();
    
    // Uppdatera mock för att simulera förändrade data
    teamService.getTeam.mockResolvedValue({
      data: {
        id: 'team1',
        name: 'Uppdaterat team',
        description: 'Uppdaterad beskrivning',
        is_private: true,
        owner_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null,
      status: 'success'
    });
    
    // Anropa refetch
    act(() => {
      result.current.refetch();
    });
    
    await waitFor(() => {
      expect(result.current.team.name).toBe('Uppdaterat team');
    });
    
    // Verifiera att tjänsteanropen gjordes igen
    expect(teamService.getTeam).toHaveBeenCalledWith('team1');
    expect(teamService.getTeamMembers).toHaveBeenCalledWith('team1');
  });
  
  it('returnerar rätt data med olika användarroller', async () => {
    // Mockimplementation för att simulera en medlem istället för ägare
    teamService.getCurrentUserRole.mockResolvedValue({
      data: 'member',
      error: null,
      status: 'success'
    });
    
    const { result } = renderHook(() => useTeam('team1'), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.currentUserRole).toBe('member');
    expect(result.current.team).toEqual(expect.objectContaining({
      id: 'team1'
    }));
  });
}); 