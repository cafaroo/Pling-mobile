import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamMemberListContainer } from '../TeamMemberListContainer';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { Result } from '@/shared/core/Result';

// Mock beroenden
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('@/ui/user/context/UserContext');
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/ui/shared/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => <div testID="error-message">{message}</div>,
}));
jest.mock('@/ui/shared/components/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div testID="empty-state">{title}</div>,
}));
jest.mock('../../MemberCard', () => ({
  MemberCard: ({ member, onPress }: any) => (
    <div testID={`member-card-${member.id}`} onClick={() => onPress(member.id)}>
      {member.name}
    </div>
  ),
}));

describe('TeamMemberList Integration Tests', () => {
  // Skapa ny QueryClient för varje test
  let queryClient: QueryClient;
  
  // Mock-implementation av useTeamWithStandardHook
  const mockGetTeamMembers = jest.fn();
  const mockRemoveTeamMember = jest.fn();
  
  // Mock-data
  const mockTeamId = 'team-123';
  const mockTeamMembers = [
    { id: 'user-1', name: 'User 1', email: 'user1@example.com', role: 'admin' },
    { id: 'user-2', name: 'User 2', email: 'user2@example.com', role: 'member' },
    { id: 'user-3', name: 'User 3', email: 'user3@example.com', role: 'member' },
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
      getTeamMembers: {
        data: mockTeamMembers,
        isLoading: false,
        error: null,
        execute: mockGetTeamMembers,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember.mockImplementation(() => Promise.resolve(Result.ok(true))),
      },
    });
    
    // Konfigurera useUserContext mock
    (useUserContext as jest.Mock).mockReturnValue({
      currentUser: { id: 'user-1' },
    });
  });
  
  it('laddar och visar teammedlemmar', async () => {
    // Rendera komponenten med QueryClient-provider
    const { getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberListContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Verifiera att getTeamMembers anropas med korrekt teamId
    expect(mockGetTeamMembers).toHaveBeenCalledWith({ teamId: mockTeamId });
    
    // Verifiera att medlemskort visas
    const memberCards = getAllByTestId(/member-card/);
    expect(memberCards).toHaveLength(3);
    expect(memberCards[0].textContent).toBe('User 1');
    expect(memberCards[1].textContent).toBe('User 2');
    expect(memberCards[2].textContent).toBe('User 3');
  });
  
  it('visar laddningsindikator när data hämtas', async () => {
    // Konfigurera loading state
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: null,
        isLoading: true,
        error: null,
        execute: mockGetTeamMembers,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberListContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('visar felmeddelande när data inte kan hämtas', async () => {
    // Konfigurera error state
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: null,
        isLoading: false,
        error: { message: 'Failed to load team members' },
        execute: mockGetTeamMembers,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberListContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Verifiera att felmeddelande visas
    expect(getByTestId('error-message')).toBeTruthy();
  });
  
  it('visar tom tillstånd när inga medlemmar finns', async () => {
    // Konfigurera tom lista
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamMembers: {
        data: [],
        isLoading: false,
        error: null,
        execute: mockGetTeamMembers,
      },
      removeTeamMember: {
        isLoading: false,
        error: null,
        execute: mockRemoveTeamMember,
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberListContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Verifiera att tom tillstånd visas
    expect(getByTestId('empty-state')).toBeTruthy();
  });
  
  it('kan ta bort en medlemmar från teamet', async () => {
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamMemberListContainer 
          teamId={mockTeamId} 
          onMemberRemoved={jest.fn()}
          canRemoveMembers={true}
        />
      </QueryClientProvider>
    );
    
    // Hitta en medlem och klicka för att ta bort
    const memberToRemove = getByTestId('member-card-user-2');
    await act(async () => {
      fireEvent.press(memberToRemove);
    });
    
    // Hitta och klicka på Ta bort-knappen i menyn
    const removeButton = getByTestId('remove-member-button');
    await act(async () => {
      fireEvent.press(removeButton);
    });
    
    // Bekräftningsdialogens Ja-knapp
    const confirmButton = getByTestId('confirm-dialog-confirm');
    await act(async () => {
      fireEvent.press(confirmButton);
    });
    
    // Verifiera att remove anropas med rätt params
    await waitFor(() => {
      expect(mockRemoveTeamMember).toHaveBeenCalledWith({ 
        teamId: mockTeamId, 
        userId: 'user-2'
      });
    });
  });
}); 