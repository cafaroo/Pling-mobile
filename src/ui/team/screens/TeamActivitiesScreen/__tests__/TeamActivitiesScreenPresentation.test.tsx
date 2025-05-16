import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivitiesScreenPresentation, TeamActivityItem } from '../TeamActivitiesScreenPresentation';

// Mock beroenden
jest.mock('@/ui/components/Screen', () => ({
  Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/ui/shared/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => <div testID="error-message">{message}</div>,
}));

jest.mock('@/ui/shared/components/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => <div testID="empty-state">{title}</div>,
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
  Text: ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <span style={style}>{children}</span>
  ),
  Divider: () => <hr />,
  List: {
    Item: ({ title, description, left, right }: any) => (
      <div testID="list-item">
        {left && left()}
        <div>{title}</div>
        <div>{description}</div>
        {right && right()}
      </div>
    ),
    Icon: () => <div testID="list-icon" />,
  },
  Chip: ({ children, onPress, selected, icon }: any) => (
    <div 
      testID="chip" 
      data-selected={selected}
      data-icon={icon}
      onClick={onPress}
    >
      {children}
    </div>
  ),
  Menu: ({ visible, children, anchor }: any) => (
    <>
      {anchor}
      {visible && <div testID="menu">{children}</div>}
    </>
  ),
  Button: ({ children, onPress }: any) => (
    <button testID="button" onClick={onPress}>
      {children}
    </button>
  ),
  Searchbar: ({ placeholder, onChangeText, value }: any) => (
    <input 
      testID="searchbar"
      placeholder={placeholder}
      onChange={(e) => onChangeText(e.target.value)}
      value={value}
    />
  ),
  IconButton: ({ icon, onPress }: any) => (
    <button testID="icon-button" data-icon={icon} onClick={onPress} />
  ),
}));

describe('TeamActivitiesScreenPresentation', () => {
  const mockActivities: TeamActivityItem[] = [
    {
      id: '1',
      type: 'message' as ActivityType,
      title: 'Test Activity 1',
      description: 'Description for activity 1',
      teamId: 'team-1',
      performedBy: 'user-1',
      performedByName: 'User 1',
      createdAt: '2023-05-16T10:00:00.000Z',
      timestamp: '16 maj, 10:00',
    },
    {
      id: '2',
      type: 'member_added' as ActivityType,
      title: 'Test Activity 2',
      description: 'Description for activity 2',
      teamId: 'team-1',
      performedBy: 'user-2',
      performedByName: 'User 2',
      targetId: 'user-3',
      targetName: 'User 3',
      createdAt: '2023-05-16T09:00:00.000Z',
      timestamp: '16 maj, 09:00',
    },
  ];
  
  const mockActivityStats: Record<ActivityType, number> = {
    message: 10,
    task: 5,
    member_added: 3,
    member_removed: 1,
    role_changed: 2,
    file_uploaded: 0,
  };
  
  const mockProps = {
    teamId: 'team-1',
    teamName: 'Test Team',
    activities: mockActivities,
    hasMore: true,
    total: 15,
    activityStats: mockActivityStats,
    isLoading: false,
    isLoadingMore: false,
    onBack: jest.fn(),
    onRetry: jest.fn(),
    onLoadMore: jest.fn(),
    onFilter: jest.fn(),
    onRefresh: jest.fn(),
    onActivityPress: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders activity list correctly', () => {
    const { getAllByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    const listItems = getAllByTestId('list-item');
    expect(listItems).toHaveLength(2);
  });
  
  it('shows loading state correctly', () => {
    const { getByText } = render(
      <TeamActivitiesScreenPresentation
        {...mockProps}
        activities={[]}
        isLoading={true}
      />
    );
    
    expect(getByText('Laddar aktiviteter...')).toBeTruthy();
  });
  
  it('shows error state correctly', () => {
    const { getByTestId } = render(
      <TeamActivitiesScreenPresentation
        {...mockProps}
        activities={[]}
        error={{ message: 'Test error message' }}
      />
    );
    
    expect(getByTestId('error-message')).toBeTruthy();
  });
  
  it('shows empty state correctly', () => {
    const { getByTestId } = render(
      <TeamActivitiesScreenPresentation
        {...mockProps}
        activities={[]}
      />
    );
    
    expect(getByTestId('empty-state')).toBeTruthy();
  });
  
  it('calls onBack when back button is pressed', () => {
    const { getByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getByTestId('back-button'));
    expect(mockProps.onBack).toHaveBeenCalled();
  });
  
  it('calls onRefresh when refresh button is pressed', () => {
    const { getByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getByTestId('refresh-button'));
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });
  
  it('shows filter menu when filter button is pressed', () => {
    const { getByTestId, queryByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    // Menu should not be visible by default
    expect(queryByTestId('menu')).toBeNull();
    
    // Click filter button
    fireEvent.click(getByTestId('icon-button'));
    
    // Menu should now be visible
    expect(queryByTestId('menu')).toBeTruthy();
  });
  
  it('calls onActivityPress when an activity is pressed', () => {
    const { getAllByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    fireEvent.press(getAllByTestId('list-item')[0]);
    expect(mockProps.onActivityPress).toHaveBeenCalledWith('1');
  });
  
  it('calls onLoadMore when Load More button is pressed', () => {
    const { getByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    fireEvent.click(getByTestId('button'));
    expect(mockProps.onLoadMore).toHaveBeenCalled();
  });
  
  it('calls onFilter when search text changes', () => {
    const { getByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    fireEvent.changeText(getByTestId('searchbar'), 'test search');
    expect(mockProps.onFilter).toHaveBeenCalledWith(expect.objectContaining({
      search: 'test search'
    }));
  });
  
  it('calls onFilter when activity type is selected', () => {
    const { getAllByTestId } = render(
      <TeamActivitiesScreenPresentation {...mockProps} />
    );
    
    fireEvent.press(getAllByTestId('chip')[0]);
    expect(mockProps.onFilter).toHaveBeenCalled();
  });
}); 