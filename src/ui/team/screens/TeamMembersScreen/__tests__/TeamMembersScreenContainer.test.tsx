import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useUserContext } from '@/ui/user/context/UserContext';
import { TeamMembersScreenContainer } from '../TeamMembersScreenContainer';

// Mock beroenden
jest.mock('expo-router');
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('@/ui/user/context/UserContext');
jest.mock('@tanstack/react-query');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock TeamMembersScreenPresentation
jest.mock('../TeamMembersScreenPresentation', () => ({
  TeamMembersScreenPresentation: ({
    teamId,
    teamName,
    members,
    onAddMember,
    onRemoveMember,
    onRoleChange,
    onBack,
    onRefresh,
  }) => (
    <div testID="presentation">
      <div testID="team-data">{JSON.stringify({ teamId, teamName, members })}</div>
      <button testID="add-button" onClick={() => onAddMember('user-1', 'member')} />
      <button testID="remove-button" onClick={() => onRemoveMember('user-2')} />
      <button testID="role-button" onClick={() => onRoleChange('user-3', 'admin')} />
      <button testID="back-button" onClick={onBack} />
      <button testID="refresh-button" onClick={onRefresh} />
    </div>
  ),
}));

// Mock PresentationAdapter
jest.mock('@/ui/shared/adapters/PresentationAdapter', () => ({
  PresentationAdapter: ({ data, renderData }) => {
    if (data) {
      return renderData(data);
    }
    return <div>Loading...</div>;
  },
}));

describe('TeamMembersScreenContainer', () => {
  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    description: 'Test Team Description',
    members: [
      { id: 'user-1', name: 'User 1', email: 'user1@example.com', role: 'admin' },
      { id: 'user-2', name: 'User 2', email: 'user2@example.com', role: 'member' },
    ],
  };
  
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockExecute = jest.fn();
  const mockRetry = jest.fn();
  
  const mockGetTeam = {
    data: mockTeam,
    isLoading: false,
    error: null,
    execute: mockExecute,
    retry: mockRetry,
    progress: null,
  };
  
  const mockAddTeamMember = {
    isLoading: false,
    error: null,
    execute: jest.fn().mockImplementation(() => Promise.resolve({ isOk: () => true })),
    progress: null,
  };
  
  const mockRemoveTeamMember = {
    isLoading: false,
    error: null,
    execute: jest.fn().mockImplementation(() => Promise.resolve({ isOk: () => true })),
    progress: null,
  };
  
  const mockUpdateTeamMemberRole = {
    isLoading: false,
    error: null,
    execute: jest.fn().mockImplementation(() => Promise.resolve({ isOk: () => true })),
    progress: null,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'team-1' });
    
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeam: mockGetTeam,
      addTeamMember: mockAddTeamMember,
      removeTeamMember: mockRemoveTeamMember,
      updateTeamMemberRole: mockUpdateTeamMemberRole,
    });
    
    (useUserContext as jest.Mock).mockReturnValue({
      currentUser: { id: 'user-1' },
    });
    
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Simulera klick på "Ta bort" knappen för borttagning av medlem
      if (buttons && title === 'Ta bort medlem') {
        const deleteButton = buttons.find(b => b.text === 'Ta bort');
        if (deleteButton && deleteButton.onPress) {
          deleteButton.onPress();
        }
      }
    });
  });
  
  it('loads team data on mount with teamId from props', async () => {
    await act(async () => {
      render(<TeamMembersScreenContainer teamId="team-1" />);
    });
    
    expect(mockExecute).toHaveBeenCalledWith({ teamId: 'team-1' });
  });
  
  it('loads team data on mount with teamId from URL params', async () => {
    await act(async () => {
      render(<TeamMembersScreenContainer />);
    });
    
    expect(mockExecute).toHaveBeenCalledWith({ teamId: 'team-1' });
  });
  
  it('handles adding a team member correctly', async () => {
    const { getByTestId } = render(<TeamMembersScreenContainer />);
    
    await act(async () => {
      getByTestId('add-button').click();
    });
    
    expect(mockAddTeamMember.execute).toHaveBeenCalledWith({
      teamId: 'team-1',
      userId: 'user-1',
      role: 'member',
    });
  });
  
  it('handles removing a team member correctly', async () => {
    const { getByTestId } = render(<TeamMembersScreenContainer />);
    
    await act(async () => {
      getByTestId('remove-button').click();
    });
    
    expect(mockRemoveTeamMember.execute).toHaveBeenCalledWith({
      teamId: 'team-1',
      userId: 'user-2',
    });
  });
  
  it('handles changing a member role correctly', async () => {
    const { getByTestId } = render(<TeamMembersScreenContainer />);
    
    await act(async () => {
      getByTestId('role-button').click();
    });
    
    expect(mockUpdateTeamMemberRole.execute).toHaveBeenCalledWith({
      teamId: 'team-1',
      userId: 'user-3',
      role: 'admin',
    });
  });
  
  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<TeamMembersScreenContainer />);
    
    await act(async () => {
      getByTestId('back-button').click();
    });
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
  
  it('passes correct data to presentation component', async () => {
    const { getByTestId } = render(<TeamMembersScreenContainer />);
    
    const teamData = JSON.parse(getByTestId('team-data').textContent || '{}');
    
    expect(teamData.teamId).toBe('team-1');
    expect(teamData.teamName).toBe('Test Team');
    expect(teamData.members).toEqual(mockTeam.members);
  });
}); 