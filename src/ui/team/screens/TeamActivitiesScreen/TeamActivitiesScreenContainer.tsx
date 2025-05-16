import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TeamActivitiesScreenPresentation, TeamActivityItem } from './TeamActivitiesScreenPresentation';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';

export interface TeamActivitiesScreenContainerProps {
  teamId?: string;
}

// Filter-typer för aktiviteter
interface ActivityFilters {
  types: ActivityType[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  search: string;
}

export const TeamActivitiesScreenContainer: React.FC<TeamActivitiesScreenContainerProps> = ({ 
  teamId: propTeamId 
}) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ teamId: string }>();
  
  // Använd teamId från props om det finns, annars från URL-parametrar
  const teamId = propTeamId || params.teamId || '';
  
  // Filter-tillstånd
  const [filters, setFilters] = useState<ActivityFilters>({
    types: [],
    dateRange: 'all',
    search: ''
  });
  
  const [limit, setLimit] = useState(20);
  
  // Hämta team med standardiserad hook
  const { getTeam } = useTeamWithStandardHook();
  
  // Konvertera dateRange till faktiska datum
  const getDateRangeFilter = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filters.dateRange) {
      case 'today':
        return { startDate: today, endDate: new Date() };
      case 'week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        return { startDate: startOfWeek, endDate: new Date() };
      }
      case 'month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: startOfMonth, endDate: new Date() };
      }
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }, [filters.dateRange]);
  
  // Beräkna datum för filter
  const { startDate, endDate } = getDateRangeFilter();
  
  // Använd useTeamActivities hook med filter
  const {
    activities,
    total,
    hasMore,
    activityStats,
    isLoading,
    isLoadingMore,
    error,
    refetch,
    fetchNextPage
  } = useTeamActivities({
    teamId,
    activityTypes: filters.types.length > 0 ? filters.types : undefined,
    startDate,
    endDate,
    limit,
    useLazyLoading: true,
    enabled: !!teamId
  });
  
  // Hämta team när komponenten laddas
  useEffect(() => {
    if (teamId) {
      getTeam.execute({ teamId });
    }
  }, [teamId]);
  
  // Hantera filtrering
  const handleFilter = (newFilters: ActivityFilters) => {
    setFilters(newFilters);
    // Återställ limit vid ny filtrering
    setLimit(20);
  };
  
  // Hantera laddning av fler aktiviteter
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  };
  
  // Gå tillbaka till föregående skärm
  const handleBack = () => {
    router.back();
  };
  
  // Hantera klick på en aktivitet för detaljvy
  const handleActivityPress = (activityId: string) => {
    router.push(`/teams/${teamId}/activity/${activityId}`);
  };
  
  // Transformera aktiviteter till UI-model
  const transformedActivities: TeamActivityItem[] = activities.map(activity => {
    return {
      ...activity,
      performedByName: activity.performedByName || 'Okänd användare',
      targetName: activity.targetName,
      timestamp: formatDate(activity.createdAt)
    };
  }).filter(activity => {
    // Applicera sökfilter om det finns
    if (filters.search && filters.search.length > 0) {
      const searchTerm = filters.search.toLowerCase();
      return (
        activity.title.toLowerCase().includes(searchTerm) ||
        activity.description.toLowerCase().includes(searchTerm) ||
        activity.performedByName.toLowerCase().includes(searchTerm) ||
        (activity.targetName && activity.targetName.toLowerCase().includes(searchTerm))
      );
    }
    return true;
  });
  
  // Formatera datum för visning
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Idag ${format(date, 'HH:mm', { locale: sv })}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Igår ${format(date, 'HH:mm', { locale: sv })}`;
    }
    
    const isThisYear = date.getFullYear() === now.getFullYear();
    
    if (isThisYear) {
      return format(date, 'd MMM HH:mm', { locale: sv });
    }
    
    return format(date, 'yyyy-MM-dd HH:mm', { locale: sv });
  };
  
  return (
    <TeamActivitiesScreenPresentation
      teamId={teamId}
      teamName={getTeam.data?.name || 'Team'}
      activities={transformedActivities}
      hasMore={hasMore}
      total={total}
      activityStats={activityStats}
      isLoading={isLoading || getTeam.isLoading}
      isLoadingMore={isLoadingMore}
      error={error ? { message: error.message, retryable: true } : getTeam.error}
      onBack={handleBack}
      onRetry={() => refetch()}
      onLoadMore={handleLoadMore}
      onFilter={handleFilter}
      onRefresh={() => refetch()}
      onActivityPress={handleActivityPress}
    />
  );
}; 