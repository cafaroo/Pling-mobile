import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { GetTeamActivitiesUseCase, TeamActivityDTO } from '../useCases/getTeamActivities';
import { CreateTeamActivityUseCase } from '../useCases/createTeamActivity';
import { useInfrastructure } from '@/infrastructure/InfrastructureProvider';

interface UseTeamActivitiesOptions {
  teamId: string;
  userId?: string;
  activityTypes?: ActivityType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  userIsTarget?: boolean;
  enabled?: boolean;
  useLazyLoading?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retryCount?: number;
}

export interface ActivityStats {
  total: number;
  byType: Record<ActivityType, number>;
  byDate: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

interface UseTeamActivitiesResult {
  activities: TeamActivityDTO[];
  total: number;
  hasMore: boolean;
  latestActivities: TeamActivityDTO[];
  activityStats: Record<ActivityType, number>;
  isLoading: boolean;
  isLoadingLatest: boolean;
  isLoadingStats: boolean;
  isLoadingMore: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  createActivity: (data: {
    activityType: ActivityType;
    performedBy: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }) => Promise<{
    success: boolean;
    error?: Error;
    activity?: TeamActivityDTO;
  }>;
  createActivityFromEvent: (
    performedBy: string, 
    eventName: string, 
    eventPayload: Record<string, any>
  ) => Promise<{
    success: boolean;
    error?: Error;
    activity?: TeamActivityDTO;
  }>;
  fetchNextPage: () => Promise<any>;
  filterByType: (type: ActivityType) => UseTeamActivitiesResult;
}

/**
 * Hook för att hämta och hantera team-aktiviteter
 */
export function useTeamActivities({
  teamId,
  userId,
  activityTypes,
  startDate,
  endDate,
  limit = 20,
  offset = 0,
  userIsTarget = false,
  enabled = true,
  useLazyLoading = false,
  staleTime = 5 * 60 * 1000, // 5 minuter default staleTime
  cacheTime = 30 * 60 * 1000, // 30 minuter default cacheTime
  retryCount = 3
}: UseTeamActivitiesOptions): UseTeamActivitiesResult {
  const queryClient = useQueryClient();
  const { teamActivityRepository } = useInfrastructure();
  
  // Skapa en unik nyckel för queryn baserat på alla parametrar
  const baseQueryKey = ['teamActivities', teamId];
  
  // Lägg till filter i query-nyckeln endast om de finns
  const createQueryKey = (base: string[], additionalParams: Record<string, any> = {}) => {
    const queryKey = [...base];
    
    if (userId) queryKey.push({ userId });
    if (activityTypes?.length) queryKey.push({ activityTypes });
    if (startDate) queryKey.push({ startDate: startDate.toISOString() });
    if (endDate) queryKey.push({ endDate: endDate.toISOString() });
    if (userIsTarget) queryKey.push({ userIsTarget });
    
    // Lägg till alla ytterligare parametrar
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined) queryKey.push({ [key]: value });
    });
    
    return queryKey;
  };
  
  // Använd infinite query för lazy loading
  const infiniteQueryResult = useInfiniteQuery({
    queryKey: createQueryKey(['teamActivitiesInfinite', teamId]),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
        const result = await getTeamActivitiesUseCase.execute({
          teamId,
          userId,
          activityTypes,
          startDate,
          endDate,
          limit,
          offset: pageParam,
          userIsTarget
        });
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.value;
      } catch (error) {
        // Kasta om felet för att React Query ska hantera det
        throw error instanceof Error ? error : new Error('Ett okänt fel inträffade');
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.offset + limit;
    },
    initialPageParam: 0,
    enabled: enabled && useLazyLoading,
    staleTime,
    gcTime: cacheTime,
    retry: retryCount,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
  // Standard query för när vi inte använder lazy loading
  const standardQueryResult = useQuery({
    queryKey: createQueryKey(['teamActivities', teamId], { limit, offset }),
    queryFn: async () => {
      try {
        const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
        const result = await getTeamActivitiesUseCase.execute({
          teamId,
          userId,
          activityTypes,
          startDate,
          endDate,
          limit,
          offset,
          userIsTarget
        });
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.value;
      } catch (error) {
        // Kasta om felet för att React Query ska hantera det
        throw error instanceof Error ? error : new Error('Ett okänt fel inträffade');
      }
    },
    enabled: enabled && !useLazyLoading,
    staleTime,
    gcTime: cacheTime,
    retry: retryCount,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
  // Kombinera data baserat på vilket query-läge som används
  const queryResult = useLazyLoading ? infiniteQueryResult : standardQueryResult;
  
  const activities = useLazyLoading
    ? (infiniteQueryResult.data?.pages.flatMap(page => page.activities) || [])
    : (standardQueryResult.data?.activities || []);
    
  const total = useLazyLoading
    ? (infiniteQueryResult.data?.pages[0]?.total || 0)
    : (standardQueryResult.data?.total || 0);
    
  const hasMore = useLazyLoading
    ? !!infiniteQueryResult.hasNextPage
    : (standardQueryResult.data?.hasMore || false);
    
  const isFetching = useLazyLoading
    ? infiniteQueryResult.isFetching
    : standardQueryResult.isFetching;
  
  // Hämta de senaste aktiviteterna (förkortad lista)
  const latestActivitiesQuery = useQuery({
    queryKey: ['teamActivitiesLatest', teamId],
    queryFn: async () => {
      try {
        const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
        const result = await getTeamActivitiesUseCase.getLatestActivities(teamId, 5);
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.value;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Ett okänt fel inträffade');
      }
    },
    enabled,
    staleTime,
    gcTime: cacheTime,
    retry: retryCount,
  });
  
  // Hämta aktivitetsstatistik
  const activityStatsQuery = useQuery({
    queryKey: ['teamActivityStats', teamId],
    queryFn: async () => {
      try {
        const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
        const result = await getTeamActivitiesUseCase.getActivityStats(teamId);
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.value;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Ett okänt fel inträffade');
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Statistik är stale efter 5 minuter
    gcTime: cacheTime,
    retry: retryCount,
  });
  
  // Mutation för att skapa en ny aktivitet med skickbar respons
  const createActivityMutation = useMutation({
    mutationFn: async ({
      activityType,
      performedBy,
      targetId,
      metadata
    }: {
      activityType: ActivityType;
      performedBy: string;
      targetId?: string;
      metadata?: Record<string, any>;
    }) => {
      try {
        const createTeamActivityUseCase = new CreateTeamActivityUseCase(teamActivityRepository);
        const result = await createTeamActivityUseCase.execute({
          teamId,
          performedBy,
          activityType,
          targetId,
          metadata
        });
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        return result.value;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Ett okänt fel inträffade');
      }
    },
    onSuccess: (newActivity) => {
      // Optimistisk uppdatering av cachen
      if (useLazyLoading) {
        // För infinite query
        const existingData = queryClient.getQueryData(
          createQueryKey(['teamActivitiesInfinite', teamId])
        );
        
        if (existingData) {
          queryClient.setQueryData(
            createQueryKey(['teamActivitiesInfinite', teamId]),
            (oldData: any) => {
              // Om första sidan inte finns, invalidera istället
              if (!oldData?.pages?.length) return oldData;
              
              // Uppdatera första sidan med ny aktivitet
              const newPages = [...oldData.pages];
              newPages[0] = {
                ...newPages[0],
                activities: [newActivity, ...newPages[0].activities],
                total: newPages[0].total + 1
              };
              
              return {
                ...oldData,
                pages: newPages
              };
            }
          );
        }
      } else {
        // För standard query
        const existingData = queryClient.getQueryData(
          createQueryKey(['teamActivities', teamId], { limit, offset })
        );
        
        if (existingData) {
          queryClient.setQueryData(
            createQueryKey(['teamActivities', teamId], { limit, offset }),
            (oldData: any) => {
              if (!oldData) return oldData;
              
              return {
                ...oldData,
                activities: [newActivity, ...oldData.activities],
                total: oldData.total + 1
              };
            }
          );
        }
      }
      
      // Uppdatera även senaste aktiviteter
      const existingLatestData = queryClient.getQueryData(['teamActivitiesLatest', teamId]);
      if (existingLatestData) {
        queryClient.setQueryData(['teamActivitiesLatest', teamId], (oldData: any) => {
          if (!oldData) return oldData;
          
          // Lägg till ny aktivitet först, men behåll bara 5
          const updatedActivities = [newActivity, ...oldData].slice(0, 5);
          return updatedActivities;
        });
      }
      
      // För statistik måste vi invalidera eftersom det är svårt att uppdatera korrekt
      queryClient.invalidateQueries({ queryKey: ['teamActivityStats', teamId] });
    }
  });
  
  // Wrapper för mutation som returnerar en strukturerad respons
  const createActivity = async (data: {
    activityType: ActivityType;
    performedBy: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const activity = await createActivityMutation.mutateAsync(data);
      return { success: true, activity };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Ett okänt fel inträffade')
      };
    }
  };
  
  // Hjälpfunktion för att skapa en aktivitet från en domänhändelse
  const createActivityFromEvent = async (
    performedBy: string,
    eventName: string,
    eventPayload: Record<string, any>
  ) => {
    try {
      const createTeamActivityUseCase = new CreateTeamActivityUseCase(teamActivityRepository);
      const result = await createTeamActivityUseCase.createFromDomainEvent(
        teamId,
        performedBy,
        eventName,
        eventPayload
      );
      
      if (result.isErr()) {
        return { 
          success: false, 
          error: new Error(result.error)
        };
      }
      
      // Uppdatera cache
      queryClient.invalidateQueries({ queryKey: ['teamActivities'] });
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesLatest'] });
      queryClient.invalidateQueries({ queryKey: ['teamActivityStats'] });
      
      return { success: true, activity: result.value };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Ett okänt fel inträffade')
      };
    }
  };
  
  // Hjälpfunktion för att hämta nästa sida av aktiviteter
  const fetchNextPage = async () => {
    if (useLazyLoading) {
      return infiniteQueryResult.fetchNextPage();
    } else if (hasMore) {
      // För standardläge måste vi hämta nästa offset manuellt
      try {
        const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
        const newOffset = offset + limit;
        
        const result = await getTeamActivitiesUseCase.execute({
          teamId,
          userId,
          activityTypes,
          startDate,
          endDate,
          limit,
          offset: newOffset,
          userIsTarget
        });
        
        if (result.isErr()) {
          throw new Error(result.error);
        }
        
        // Lägg till nya aktiviteter till den befintliga datan i cachen
        queryClient.setQueryData(
          createQueryKey(['teamActivities', teamId], { limit, offset }),
          (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              activities: [...oldData.activities, ...result.value.activities],
              offset: newOffset,
              hasMore: result.value.hasMore
            };
          }
        );
        
        // Spara även nästa sida i cachen
        queryClient.setQueryData(
          createQueryKey(['teamActivities', teamId], { limit, offset: newOffset }),
          result.value
        );
        
        return result.value;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Ett okänt fel inträffade');
      }
    }
    
    return Promise.resolve({ hasMore: false });
  };
  
  // Hjälpfunktion för att få en filtrerad variant av samma hook
  const filterByType = (type: ActivityType): UseTeamActivitiesResult => {
    // Skapa en ny filtrerad version av samma hook med additionalTypes
    return useTeamActivities({
      teamId,
      userId,
      activityTypes: [type],
      startDate,
      endDate,
      limit,
      offset,
      userIsTarget,
      enabled,
      useLazyLoading,
      staleTime,
      cacheTime
    });
  };
  
  return {
    activities,
    total,
    hasMore,
    latestActivities: latestActivitiesQuery.data || [],
    activityStats: activityStatsQuery.data || {},
    isLoading: queryResult.isLoading,
    isLoadingLatest: latestActivitiesQuery.isLoading,
    isLoadingStats: activityStatsQuery.isLoading,
    isLoadingMore: useLazyLoading ? infiniteQueryResult.isFetchingNextPage : false,
    isFetching,
    error: queryResult.error ? (queryResult.error as Error) : null,
    refetch: queryResult.refetch,
    createActivity,
    createActivityFromEvent,
    fetchNextPage,
    filterByType
  };
} 