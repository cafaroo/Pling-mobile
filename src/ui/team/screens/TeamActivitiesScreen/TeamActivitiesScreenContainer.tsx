import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TeamActivitiesScreenPresentation, TeamActivityItem } from './TeamActivitiesScreenPresentation';
import { useTeamWithStandardHook } from '@/application/team/hooks/useTeamWithStandardHook';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  
  // Använd teamId från props om det finns, annars från URL-parametrar
  const teamId = useMemo(() => propTeamId || params.teamId || '', [propTeamId, params.teamId]);
  
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
  const { startDate, endDate } = useMemo(() => getDateRangeFilter(), [getDateRangeFilter]);
  
  // Filtrerade aktivitetstyper - använd useMemo för att förhindra onödiga omberäkningar
  const filteredActivityTypes = useMemo(() => 
    filters.types.length > 0 ? filters.types : undefined, 
  [filters.types]);
  
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
    activityTypes: filteredActivityTypes,
    startDate,
    endDate,
    limit,
    useLazyLoading: true,
    enabled: !!teamId,
    // Lägg till staleTime för att förbättra caching
    staleTime: 5 * 60 * 1000, // 5 minuter
  });
  
  // Hämta team när komponenten laddas - använd useEffect med callback
  useEffect(() => {
    if (teamId) {
      getTeam.execute({ teamId });
    }
  }, [teamId, getTeam]);
  
  // Hantera filtrering med useCallback
  const handleFilter = useCallback((newFilters: ActivityFilters) => {
    setFilters(newFilters);
    // Återställ limit vid ny filtrering
    setLimit(20);
  }, []);
  
  // Hantera laddning av fler aktiviteter med useCallback
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  }, [hasMore, isLoadingMore, fetchNextPage]);
  
  // Gå tillbaka till föregående skärm med useCallback
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // Hantera klick på en aktivitet för detaljvy med useCallback
  const handleActivityPress = useCallback((activityId: string) => {
    router.push(`/teams/${teamId}/activity/${activityId}`);
  }, [router, teamId]);
  
  // Hantera manuell uppdatering med useCallback
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['teamActivities', teamId] });
    queryClient.invalidateQueries({ queryKey: ['teamActivitiesInfinite', teamId] });
    refetch();
    getTeam.execute({ teamId });
  }, [queryClient, teamId, refetch, getTeam]);
  
  // Hantera retry av datahämtning med useCallback
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Transformera aktiviteter till UI-model med useMemo för att minska onödiga renderingar
  const transformedActivities: TeamActivityItem[] = useMemo(() => {
    return activities
      .map(activity => {
        return {
          ...activity,
          performedByName: activity.performedByName || 'Okänd användare',
          targetName: activity.targetName,
          timestamp: formatDate(activity.createdAt)
        };
      })
      .filter(activity => {
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
  }, [activities, filters.search]);
  
  // Formatera datum för visning - memotera inte denna funktion då den används inne i useMemo
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
  
  // Använd useMemo för att beräkna kombinerat fel
  const combinedError = useMemo(() => 
    error ? { message: error.message, retryable: true } : getTeam.error,
  [error, getTeam.error]);
  
  // Använd useMemo för att avgöra om något laddas
  const isAnyLoading = useMemo(() => 
    isLoading || getTeam.isLoading,
  [isLoading, getTeam.isLoading]);
  
  // Använd useMemo för att hämta teamnamn med fallback
  const displayTeamName = useMemo(() => 
    getTeam.data?.name || 'Team',
  [getTeam.data?.name]);
  
  return (
    <TeamActivitiesScreenPresentation
      teamId={teamId}
      teamName={displayTeamName}
      activities={transformedActivities}
      hasMore={hasMore}
      total={total}
      activityStats={activityStats}
      isLoading={isAnyLoading}
      isLoadingMore={isLoadingMore}
      error={combinedError}
      onBack={handleBack}
      onRetry={handleRetry}
      onLoadMore={handleLoadMore}
      onFilter={handleFilter}
      onRefresh={handleRefresh}
      onActivityPress={handleActivityPress}
    />
  );
}; 