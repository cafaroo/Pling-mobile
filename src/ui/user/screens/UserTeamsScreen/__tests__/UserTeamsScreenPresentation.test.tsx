import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserTeamsScreenPresentation, TeamItem } from '../UserTeamsScreenPresentation';

// Mock the dependencies
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/ui/shared/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => <div testID="error-message">{message}</div>,
}));

jest.mock('@/ui/shared/components/EmptyState', () => ({
  EmptyState: ({ title, onAction }: { title: string; onAction: () => void }) => (
    <div testID="empty-state" onClick={onAction}>{title}</div>
  ),
}));

describe('UserTeamsScreenPresentation', () => {
  const mockTeams: TeamItem[] = [
    {
      id: '1',
      name: 'Team 1',
      description: 'Description for team 1',
      memberCount: 5,
      userRole: 'Admin',
    },
    {
      id: '2',
      name: 'Team 2',
      description: 'Description for team 2',
      memberCount: 3,
      userRole: 'Medlem',
    },
  ];
  
  const mockProps = {
    teams: mockTeams,
    isLoading: false,
    error: null,
    onTeamPress: jest.fn(),
    onCreateTeamPress: jest.fn(),
    onBack: jest.fn(),
  };
  
  it('renders loading state correctly', () => {
    const { getByText } = render(
      <UserTeamsScreenPresentation
        {...mockProps}
        isLoading={true}
      />
    );
    
    expect(getByText('Laddar team...')).toBeTruthy();
  });
  
  it('renders error state correctly', () => {
    const { getByTestId } = render(
      <UserTeamsScreenPresentation
        {...mockProps}
        error={new Error('Test error')}
      />
    );
    
    expect(getByTestId('error-message')).toBeTruthy();
  });
  
  it('renders empty state correctly', () => {
    const { getByTestId } = render(
      <UserTeamsScreenPresentation
        {...mockProps}
        teams={[]}
      />
    );
    
    expect(getByTestId('empty-state')).toBeTruthy();
  });
  
  it('renders team list correctly', () => {
    const { getByText } = render(
      <UserTeamsScreenPresentation {...mockProps} />
    );
    
    expect(getByText('Team 1')).toBeTruthy();
    expect(getByText('Team 2')).toBeTruthy();
    expect(getByText('Description for team 1')).toBeTruthy();
    expect(getByText('5 medlemmar')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
  });
  
  it('calls onTeamPress when a team card is pressed', () => {
    const { getByText } = render(
      <UserTeamsScreenPresentation {...mockProps} />
    );
    
    fireEvent.press(getByText('Team 1'));
    expect(mockProps.onTeamPress).toHaveBeenCalledWith('1');
  });
  
  it('calls onCreateTeamPress when create team button is pressed in empty state', () => {
    const { getByTestId } = render(
      <UserTeamsScreenPresentation
        {...mockProps}
        teams={[]}
      />
    );
    
    fireEvent.press(getByTestId('empty-state'));
    expect(mockProps.onCreateTeamPress).toHaveBeenCalled();
  });
  
  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(
      <UserTeamsScreenPresentation {...mockProps} />
    );
    
    // Note: In an actual implementation you might need a more specific selector
    // depending on how Appbar.BackAction renders in your test environment
    // This is just a placeholder for the test intent
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalled();
  });
}); 