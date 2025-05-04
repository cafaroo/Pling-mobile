import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TeamScreen } from '../TeamScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getTeam, updateTeamMemberStatus, removeTeamMember } from '@/services/teamService';

// Mock services
jest.mock('@/services/teamService', () => ({
  getTeam: jest.fn(),
  updateTeamMemberStatus: jest.fn(),
  removeTeamMember: jest.fn(),
}));

// Mock toast functionality
const mockToast = {
  show: jest.fn()
};

jest.mock('react-native-toast-message', () => ({
  show: mockToast.show
}));

const mockTeam = {
  id: '1',
  name: 'Test Team',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner_id: 'user1',
  is_private: false,
  team_members: [
    { id: '1', user_id: 'user1', team_id: '1', role: 'owner', status: 'active' },
    { id: '2', user_id: 'user2', team_id: '1', role: 'member', status: 'pending' },
    { id: '3', user_id: 'user3', team_id: '1', role: 'member', status: 'active' }
  ]
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('TeamScreen', () => {
  beforeEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    (getTeam as jest.Mock).mockResolvedValue({ success: true, data: mockTeam });
  });

  it('renderar laddningstillstånd korrekt', async () => {
    const { getByTestId, getByText } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    expect(getByTestId('team-loading-skeleton')).toBeTruthy();
    expect(getByText('Laddar team...')).toBeTruthy();

    await waitFor(() => {
      expect(getTeam).toHaveBeenCalledWith('1');
    });
  });

  it('renderar teamdata korrekt efter laddning', async () => {
    const { getByText, queryByTestId } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    await waitFor(() => {
      expect(queryByTestId('team-loading-skeleton')).toBeNull();
      expect(getByText('Test Team')).toBeTruthy();
      expect(getByText('Medlemmar')).toBeTruthy();
      expect(getByText('Inställningar')).toBeTruthy();
    });
  });

  it('hanterar fel vid laddning av team', async () => {
    (getTeam as jest.Mock).mockRejectedValue(new Error('Nätverksfel'));

    const { getByText, getByTestId } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    await waitFor(() => {
      expect(getByText('Kunde inte ladda teamet')).toBeTruthy();
      expect(getByText('Nätverksfel')).toBeTruthy();
      expect(getByTestId('retry-button')).toBeTruthy();
    });
  });

  it('växlar mellan medlemmar och inställningar', async () => {
    const { getByText, queryByTestId } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    await waitFor(() => {
      expect(queryByTestId('team-loading-skeleton')).toBeNull();
    });

    const settingsTab = getByText('Inställningar');
    fireEvent.press(settingsTab);
    expect(queryByTestId('team-settings')).toBeTruthy();

    const membersTab = getByText('Medlemmar');
    fireEvent.press(membersTab);
    expect(queryByTestId('team-members')).toBeTruthy();
  });

  it('hanterar godkännande av väntande medlem', async () => {
    (updateTeamMemberStatus as jest.Mock).mockResolvedValue({ success: true });

    const { getByTestId } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    await waitFor(() => {
      expect(queryByTestId('team-loading-skeleton')).toBeNull();
    });

    const approveButton = getByTestId('approve-member-user2');
    fireEvent.press(approveButton);

    await waitFor(() => {
      expect(updateTeamMemberStatus).toHaveBeenCalledWith('1', 'user2', 'active');
      expect(getTeam).toHaveBeenCalledTimes(2); // Initial load + after approval
    });
  });

  it('hanterar avvisning av väntande medlem', async () => {
    (removeTeamMember as jest.Mock).mockResolvedValue({ success: true });

    const { getByTestId } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    await waitFor(() => {
      expect(queryByTestId('team-loading-skeleton')).toBeNull();
    });

    const rejectButton = getByTestId('reject-member-user2');
    fireEvent.press(rejectButton);

    await waitFor(() => {
      expect(removeTeamMember).toHaveBeenCalledWith('1', 'user2');
      expect(getTeam).toHaveBeenCalledTimes(2); // Initial load + after rejection
    });
  });

  it('hanterar uppdatering via pull-to-refresh', async () => {
    const { getByTestId } = renderWithProviders(
      <TeamScreen teamId="1" />
    );

    await waitFor(() => {
      expect(queryByTestId('team-loading-skeleton')).toBeNull();
    });

    const scrollView = getByTestId('team-scroll-view');
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: -100 },
        contentSize: { height: 500, width: 100 },
        layoutMeasurement: { height: 100, width: 100 }
      }
    });

    await waitFor(() => {
      expect(getTeam).toHaveBeenCalledTimes(2);
    });
  });

  it('renderar tillbaka-knapp när onBackPress finns', async () => {
    const mockOnBackPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <TeamScreen teamId="1" onBackPress={mockOnBackPress} />
    );

    await waitFor(() => {
      expect(queryByTestId('team-loading-skeleton')).toBeNull();
    });

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    expect(mockOnBackPress).toHaveBeenCalled();
  });
}); 