import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { TeamMembersScreenPresentation, TeamMember } from '../TeamMembersScreenPresentation';

// Mock beroenden
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/ui/shared/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => <div testID="error-message">{message}</div>,
}));

jest.mock('@/ui/shared/components/EmptyState', () => ({
  EmptyState: ({ title, onAction }: { title: string; onAction?: () => void }) => (
    <div testID="empty-state" onClick={onAction}>{title}</div>
  ),
}));

jest.mock('@/ui/shared/components/ProgressBar', () => ({
  ProgressBar: () => <div testID="progress-bar" />,
}));

jest.mock('react-native-paper', () => ({
  Appbar: {
    Header: ({ children }: { children: React.ReactNode }) => <div testID="appbar-header">{children}</div>,
    BackAction: ({ onPress }: { onPress: () => void }) => (
      <button testID="back-button" onClick={onPress}>Back</button>
    ),
    Content: ({ title }: { title: string }) => <div testID="appbar-content">{title}</div>,
    Action: ({ onPress }: { onPress: () => void }) => (
      <button testID="refresh-button" onClick={onPress}>Refresh</button>
    ),
  },
}));

// Mock för MemberCard och AddMemberForm
jest.mock('../../../components/MemberCard', () => ({
  MemberCard: ({ member, onRemove, onRoleChange }: { 
    member: any, 
    onRemove?: () => void, 
    onRoleChange?: (role: string) => void 
  }) => (
    <div testID="member-card" data-member-id={member.id}>
      <span>{member.name}</span>
      {onRemove && <button testID="remove-button" onClick={onRemove}>Remove</button>}
      {onRoleChange && <button testID="role-button" onClick={() => onRoleChange('admin')}>Change Role</button>}
    </div>
  ),
}));

jest.mock('../../../components/AddMemberForm', () => ({
  AddMemberForm: ({ onSubmit }: { onSubmit: (userId: string, role: string) => void }) => (
    <div testID="add-member-form">
      <button testID="submit-button" onClick={() => onSubmit('test-user', 'member')}>Add</button>
    </div>
  ),
}));

describe('TeamMembersScreenPresentation', () => {
  const mockMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Test User 1',
      email: 'test1@example.com',
      role: 'admin',
    },
    {
      id: '2',
      name: 'Test User 2',
      email: 'test2@example.com',
      role: 'member',
    },
  ];
  
  const mockProps = {
    teamId: 'team-1',
    teamName: 'Test Team',
    teamDescription: 'Test Team Description',
    members: mockMembers,
    isCurrentUserAdmin: true,
    showAddMemberForm: false,
    fadeAnim: new Animated.Value(0),
    isLoading: false,
    isAnyOperationLoading: false,
    onAddMember: jest.fn(),
    onRemoveMember: jest.fn(),
    onRoleChange: jest.fn(),
    onToggleAddMemberForm: jest.fn(),
    onRetry: jest.fn(),
    onRefresh: jest.fn(),
    onBack: jest.fn(),
    isAddMemberLoading: false,
  };
  
  it('renders loading state correctly', () => {
    const { getByText, getByTestId } = render(
      <TeamMembersScreenPresentation
        {...mockProps}
        isLoading={true}
        loadingMessage="Testar laddning..."
      />
    );
    
    expect(getByText('Testar laddning...')).toBeTruthy();
    expect(getByTestId('progress-bar')).toBeTruthy();
  });
  
  it('renders error state correctly', () => {
    const { getByTestId } = render(
      <TeamMembersScreenPresentation
        {...mockProps}
        error={{ message: 'Test error message' }}
      />
    );
    
    expect(getByTestId('error-message')).toBeTruthy();
  });
  
  it('renders empty state when no members', () => {
    const { getByTestId } = render(
      <TeamMembersScreenPresentation
        {...mockProps}
        members={[]}
      />
    );
    
    expect(getByTestId('empty-state')).toBeTruthy();
  });
  
  it('renders member list correctly', () => {
    const { getAllByTestId } = render(
      <TeamMembersScreenPresentation {...mockProps} />
    );
    
    const memberCards = getAllByTestId('member-card');
    expect(memberCards).toHaveLength(2);
    expect(memberCards[0].getAttribute('data-member-id')).toBe('1');
    expect(memberCards[1].getAttribute('data-member-id')).toBe('2');
  });
  
  it('shows add member form when showAddMemberForm is true', () => {
    const { getByTestId } = render(
      <TeamMembersScreenPresentation
        {...mockProps}
        showAddMemberForm={true}
      />
    );
    
    expect(getByTestId('add-member-form')).toBeTruthy();
  });
  
  it('calls onAddMember when add member form is submitted', () => {
    const { getByTestId } = render(
      <TeamMembersScreenPresentation
        {...mockProps}
        showAddMemberForm={true}
      />
    );
    
    fireEvent.click(getByTestId('submit-button'));
    expect(mockProps.onAddMember).toHaveBeenCalledWith('test-user', 'member');
  });
  
  it('calls onRemoveMember when remove button is clicked', () => {
    const { getAllByTestId } = render(
      <TeamMembersScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getAllByTestId('remove-button')[0]);
    expect(mockProps.onRemoveMember).toHaveBeenCalledWith('1');
  });
  
  it('calls onRoleChange when role button is clicked', () => {
    const { getAllByTestId } = render(
      <TeamMembersScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getAllByTestId('role-button')[0]);
    expect(mockProps.onRoleChange).toHaveBeenCalledWith('1', 'admin');
  });
  
  it('calls onBack when back button is clicked', () => {
    const { getByTestId } = render(
      <TeamMembersScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getByTestId('back-button'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });
  
  it('calls onRefresh when refresh button is clicked', () => {
    const { getByTestId } = render(
      <TeamMembersScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getByTestId('refresh-button'));
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });
}); 