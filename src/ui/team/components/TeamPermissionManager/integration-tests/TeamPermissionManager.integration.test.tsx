import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamPermissionManagerContainer } from '../TeamPermissionManagerContainer';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { Result } from '@/shared/core/Result';

// Mock beroenden
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('@/ui/user/context/UserContext');
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock React Native Paper komponenter
jest.mock('react-native-paper', () => ({
  Button: ({ onPress, children }: any) => (
    <button testID="button" onClick={onPress}>{children}</button>
  ),
  Checkbox: ({ status, onPress }: any) => (
    <input 
      type="checkbox" 
      testID="checkbox"
      checked={status === 'checked'} 
      onChange={onPress} 
    />
  ),
  List: {
    Item: ({ title, description, right, onPress }: any) => (
      <div testID={`permission-item-${title}`} onClick={onPress}>
        <div>{title}</div>
        <div>{description}</div>
        {right && right({})}
      </div>
    ),
  },
  Dialog: {
    Title: ({ children }: any) => <div testID="dialog-title">{children}</div>,
    Content: ({ children }: any) => <div testID="dialog-content">{children}</div>,
    Actions: ({ children }: any) => <div testID="dialog-actions">{children}</div>,
  },
  Divider: () => <hr />,
  ActivityIndicator: () => <div testID="loading-indicator" />,
}));

describe('TeamPermissionManager Integration Tests', () => {
  // Skapa ny QueryClient för varje test
  let queryClient: QueryClient;
  
  // Mock-implementation av useTeamWithStandardHook
  const mockGetTeamPermissions = jest.fn();
  const mockUpdateTeamPermissions = jest.fn();
  
  // Mock-data
  const mockTeamId = 'team-123';
  const mockPermissions = {
    canInviteMembers: true,
    canRemoveMembers: true,
    canEditTeamSettings: false,
    canManagePermissions: false,
    canCreateThreads: true,
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
    
    // Konfigurera useTeamWithStandardHook mock
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamPermissions: {
        data: mockPermissions,
        isLoading: false,
        error: null,
        execute: mockGetTeamPermissions,
      },
      updateTeamPermissions: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamPermissions.mockImplementation(() => Promise.resolve(Result.ok(true))),
      },
    });
    
    // Konfigurera useUserContext mock
    (useUserContext as jest.Mock).mockReturnValue({
      currentUser: { id: 'user-1', role: 'admin' },
    });
  });
  
  it('laddar och visar teambehörigheter', async () => {
    // Rendera komponenten med QueryClient-provider
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamPermissionManagerContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Verifiera att getTeamPermissions anropas med korrekt teamId
    expect(mockGetTeamPermissions).toHaveBeenCalledWith({ teamId: mockTeamId });
    
    // Verifiera att behörighetslistan visas och har rätt värden
    const inviteItem = getByTestId('permission-item-canInviteMembers');
    const removeItem = getByTestId('permission-item-canRemoveMembers');
    const editItem = getByTestId('permission-item-canEditTeamSettings');
    
    expect(inviteItem).toBeTruthy();
    expect(removeItem).toBeTruthy();
    expect(editItem).toBeTruthy();
  });
  
  it('visar laddningsindikator när data hämtas', async () => {
    // Konfigurera loading state
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamPermissions: {
        data: null,
        isLoading: true,
        error: null,
        execute: mockGetTeamPermissions,
      },
      updateTeamPermissions: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamPermissions,
      },
    });
    
    // Rendera komponenten
    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamPermissionManagerContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Verifiera att laddningsindikator visas
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('uppdaterar behörigheter när en checkbox ändras', async () => {
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamPermissionManagerContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Hitta behörighetsposten för canEditTeamSettings och klicka på dess checkbox
    const editItem = getByTestId('permission-item-canEditTeamSettings');
    const checkboxes = getAllByTestId('checkbox');
    
    // Klicka på checkbox för canEditTeamSettings (som initialt är false)
    await act(async () => {
      fireEvent.click(checkboxes[2]); // Tredje checkboxen för canEditTeamSettings
    });
    
    // Verifiera att updateTeamPermissions anropas med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateTeamPermissions).toHaveBeenCalledWith({
        teamId: mockTeamId,
        permissions: {
          ...mockPermissions,
          canEditTeamSettings: true // Ändrat från false till true
        }
      });
    });
  });
  
  it('visar bekräftelsedialog när känsliga behörigheter ändras', async () => {
    // Konfigurera mock för att visa bekräftelsedialog för canManagePermissions
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeamPermissions: {
        data: mockPermissions,
        isLoading: false,
        error: null,
        execute: mockGetTeamPermissions,
      },
      updateTeamPermissions: {
        isLoading: false,
        error: null,
        execute: mockUpdateTeamPermissions,
        requireConfirmation: true,
      },
    });
    
    // Rendera komponenten
    const { getByTestId, getAllByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <TeamPermissionManagerContainer teamId={mockTeamId} />
      </QueryClientProvider>
    );
    
    // Hitta behörighetsposten för canManagePermissions och klicka på dess checkbox
    const manageItem = getByTestId('permission-item-canManagePermissions');
    const checkboxes = getAllByTestId('checkbox');
    
    // Klicka på checkbox för canManagePermissions
    await act(async () => {
      fireEvent.click(checkboxes[3]); // Fjärde checkboxen för canManagePermissions
    });
    
    // Verifiera att bekräftelsedialogrutan visas
    expect(getByTestId('dialog-title')).toBeTruthy();
    
    // Bekräfta ändringen
    const confirmButton = getByTestId('confirm-button');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Verifiera att updateTeamPermissions anropas med rätt parametrar
    await waitFor(() => {
      expect(mockUpdateTeamPermissions).toHaveBeenCalledWith({
        teamId: mockTeamId,
        permissions: {
          ...mockPermissions,
          canManagePermissions: true // Ändrat från false till true
        }
      });
    });
  });
}); 