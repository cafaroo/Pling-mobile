import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { UserTeamsScreenContainer } from '../UserTeamsScreenContainer';
import { render } from '@testing-library/react-native';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useUser } from '@/application/user/hooks/useUser';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('@/application/team/hooks/useTeam');
jest.mock('@/application/user/hooks/useUser');
jest.mock('expo-router');

// Mock UserTeamsScreenPresentation
jest.mock('../UserTeamsScreenPresentation', () => ({
  UserTeamsScreenPresentation: ({
    teams,
    isLoading,
    error,
    onTeamPress,
    onCreateTeamPress,
    onBack,
  }) => (
    <div testID="presentation">
      <button testID="team-button" onClick={() => onTeamPress('1')} />
      <button testID="create-button" onClick={onCreateTeamPress} />
      <button testID="back-button" onClick={onBack} />
      <div testID="teams-data">{JSON.stringify(teams)}</div>
      <div testID="loading-state">{String(isLoading)}</div>
      <div testID="error-state">{error ? error.message : 'null'}</div>
    </div>
  ),
}));

describe('UserTeamsScreenContainer', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
  };
  
  const mockTeams = [
    {
      id: { toString: () => '1' },
      name: 'Team 1',
      description: 'Description for team 1',
      members: [
        { userId: { toString: () => 'user-1' }, role: 'Admin' },
        { userId: { toString: () => 'user-2' }, role: 'Member' },
      ],
      avatarUrl: null,
    },
    {
      id: { toString: () => '2' },
      name: 'Team 2',
      description: 'Description for team 2',
      members: [
        { userId: { toString: () => 'user-1' }, role: 'Member' },
        { userId: { toString: () => 'user-3' }, role: 'Admin' },
      ],
      avatarUrl: null,
    },
  ];
  
  const mockUseUserTeams = jest.fn();
  const mockPush = jest.fn();
  const mockBack = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUser as jest.Mock).mockReturnValue({
      data: mockUser,
      isLoading: false,
    });
    
    (useTeam as jest.Mock).mockReturnValue({
      useUserTeams: mockUseUserTeams,
    });
    
    mockUseUserTeams.mockReturnValue({
      data: mockTeams,
      isLoading: false,
      error: null,
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });
  
  it('passes correct props to presentation component', () => {
    const { getByTestId } = render(<UserTeamsScreenContainer />);
    
    const teamsData = JSON.parse(getByTestId('teams-data').textContent || '[]');
    
    // Verify teams are formatted correctly
    expect(teamsData).toHaveLength(2);
    expect(teamsData[0].id).toBe('1');
    expect(teamsData[0].name).toBe('Team 1');
    expect(teamsData[0].userRole).toBe('Admin');
    expect(teamsData[1].userRole).toBe('Member');
    
    // Verify loading state
    expect(getByTestId('loading-state').textContent).toBe('false');
    
    // Verify error state
    expect(getByTestId('error-state').textContent).toBe('null');
  });
  
  it('navigates to team details when a team is pressed', () => {
    const { getByTestId } = render(<UserTeamsScreenContainer />);
    
    act(() => {
      getByTestId('team-button').click();
    });
    
    expect(mockPush).toHaveBeenCalledWith('/team/1');
  });
  
  it('navigates to create team screen when create team is pressed', () => {
    const { getByTestId } = render(<UserTeamsScreenContainer />);
    
    act(() => {
      getByTestId('create-button').click();
    });
    
    expect(mockPush).toHaveBeenCalledWith('/team/create');
  });
  
  it('goes back when back button is pressed', () => {
    const { getByTestId } = render(<UserTeamsScreenContainer />);
    
    act(() => {
      getByTestId('back-button').click();
    });
    
    expect(mockBack).toHaveBeenCalled();
  });
  
  it('handles loading state correctly', () => {
    (useUser as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });
    
    const { getByTestId } = render(<UserTeamsScreenContainer />);
    
    expect(getByTestId('loading-state').textContent).toBe('true');
  });
  
  it('handles error state correctly', () => {
    mockUseUserTeams.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load teams'),
    });
    
    const { getByTestId } = render(<UserTeamsScreenContainer />);
    
    expect(getByTestId('error-state').textContent).toBe('Failed to load teams');
  });
}); 