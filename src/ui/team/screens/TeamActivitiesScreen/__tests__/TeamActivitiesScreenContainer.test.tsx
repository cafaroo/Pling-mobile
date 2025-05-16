import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';
import { TeamActivitiesScreenContainer } from '../TeamActivitiesScreenContainer';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';

// Mock beroenden
jest.mock('expo-router');
jest.mock('@/application/team/hooks/useTeamWithStandardHook');
jest.mock('@/application/team/hooks/useTeamActivities');
jest.mock('date-fns/locale');

// Mock TeamActivitiesScreenPresentation
jest.mock('../TeamActivitiesScreenPresentation', () => ({
  TeamActivitiesScreenPresentation: ({
    teamId,
    teamName,
    activities,
    onBack,
    onRefresh,
    onLoadMore,
    onFilter,
    onActivityPress,
  }) => (
    <div testID="presentation">
      <div testID="team-data">{JSON.stringify({ teamId, teamName })}</div>
      <div testID="activities">{JSON.stringify(activities)}</div>
      <button testID="back-button" onClick={onBack} />
      <button testID="refresh-button" onClick={onRefresh} />
      <button testID="load-more-button" onClick={onLoadMore} />
      <button 
        testID="filter-button" 
        onClick={() => onFilter({ types: ['message' as ActivityType], dateRange: 'week', search: 'test' })} 
      />
      <button testID="activity-button" onClick={() => onActivityPress('activity-1')} />
    </div>
  ),
}));

describe('TeamActivitiesScreenContainer', () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockTeam = { id: 'team-1', name: 'Test Team' };
  const mockGetTeam = {
    data: mockTeam,
    isLoading: false,
    error: null,
    execute: jest.fn(),
    retry: jest.fn(),
  };
  
  const mockActivities = [
    {
      id: 'activity-1',
      type: 'message',
      title: 'Test Activity 1',
      description: 'Description for activity 1',
      teamId: 'team-1',
      performedBy: 'user-1',
      performedByName: 'User 1',
      createdAt: '2023-05-16T10:00:00.000Z',
    },
    {
      id: 'activity-2',
      type: 'member_added',
      title: 'Test Activity 2',
      description: 'Description for activity 2',
      teamId: 'team-1',
      performedBy: 'user-2',
      performedByName: 'User 2',
      targetId: 'user-3',
      targetName: 'User 3',
      createdAt: '2023-05-16T09:00:00.000Z',
    },
  ];
  
  const mockTeamActivities = {
    activities: mockActivities,
    total: 15,
    hasMore: true,
    activityStats: {
      message: 10,
      task: 5,
      member_added: 3,
      member_removed: 1,
      role_changed: 2,
      file_uploaded: 0,
    },
    isLoading: false,
    isLoadingMore: false,
    error: null,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ teamId: 'team-1' });
    
    (useTeamWithStandardHook as jest.Mock).mockReturnValue({
      getTeam: mockGetTeam,
    });
    
    (useTeamActivities as jest.Mock).mockReturnValue(mockTeamActivities);
  });
  
  it('loads team and activities on mount', async () => {
    render(<TeamActivitiesScreenContainer />);
    
    expect(mockGetTeam.execute).toHaveBeenCalledWith({ teamId: 'team-1' });
  });
  
  it('uses teamId from props if provided', async () => {
    render(<TeamActivitiesScreenContainer teamId="team-2" />);
    
    expect(mockGetTeam.execute).toHaveBeenCalledWith({ teamId: 'team-2' });
  });
  
  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<TeamActivitiesScreenContainer />);
    
    await act(async () => {
      getByTestId('back-button').click();
    });
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
  
  it('refreshes activities when refresh button is pressed', async () => {
    const { getByTestId } = render(<TeamActivitiesScreenContainer />);
    
    await act(async () => {
      getByTestId('refresh-button').click();
    });
    
    expect(mockTeamActivities.refetch).toHaveBeenCalled();
  });
  
  it('loads more activities when load more button is pressed', async () => {
    const { getByTestId } = render(<TeamActivitiesScreenContainer />);
    
    await act(async () => {
      getByTestId('load-more-button').click();
    });
    
    expect(mockTeamActivities.fetchNextPage).toHaveBeenCalled();
  });
  
  it('applies filters when filter button is pressed', async () => {
    const { getByTestId } = render(<TeamActivitiesScreenContainer />);
    
    // Initial state should use default filters
    expect(useTeamActivities).toHaveBeenCalledWith(expect.objectContaining({
      teamId: 'team-1',
      activityTypes: undefined,
    }));
    
    // Apply filters
    await act(async () => {
      getByTestId('filter-button').click();
    });
    
    // re-render with new state after filter change
    render(<TeamActivitiesScreenContainer />);
    
    // Now should be called with the filtered state
    expect(useTeamActivities).toHaveBeenCalledWith(expect.objectContaining({
      teamId: 'team-1',
      activityTypes: ['message'],
    }));
  });
  
  it('navigates to activity details when an activity is pressed', async () => {
    const { getByTestId } = render(<TeamActivitiesScreenContainer />);
    
    await act(async () => {
      getByTestId('activity-button').click();
    });
    
    expect(mockRouter.push).toHaveBeenCalledWith('/teams/team-1/activity/activity-1');
  });
  
  it('transforms activities for UI with correct formatting', () => {
    const { getByTestId } = render(<TeamActivitiesScreenContainer />);
    
    // Get the transformed activities from the rendered output
    const activitiesJson = getByTestId('activities').textContent;
    const activities = JSON.parse(activitiesJson || '[]');
    
    // Should have same length as mock activities
    expect(activities).toHaveLength(2);
    
    // Should include formatted timestamp
    expect(activities[0]).toHaveProperty('timestamp');
    expect(activities[1]).toHaveProperty('timestamp');
    
    // Should preserve original properties
    expect(activities[0].id).toBe('activity-1');
    expect(activities[0].performedByName).toBe('User 1');
    expect(activities[1].targetName).toBe('User 3');
  });
}); 