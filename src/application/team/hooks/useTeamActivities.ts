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
  error: Error | null;
  refetch: () => Promise<any>;
  createActivity: (data: {
    activityType: ActivityType;
    performedBy: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }) => void;
  createActivityFromEvent: (
    performedBy: string, 
    eventName: string, 
    eventPayload: Record<string, any>
  ) => Promise<any>;
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
  useLazyLoading = false
}: UseTeamActivitiesOptions): UseTeamActivitiesResult {
  const queryClient = useQueryClient();
  const { teamActivityRepository } = useInfrastructure();
  
  // Använd infinite query för lazy loading
  const infiniteQueryResult = useInfiniteQuery({
    queryKey: ['teamActivitiesInfinite', teamId, userId, activityTypes, startDate, endDate, limit, userIsTarget],
    queryFn: async ({ pageParam = 0 }) => {
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
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.offset + limit;
    },
    initialPageParam: 0,
    enabled: enabled && useLazyLoading
  });
  
  // Standard query för när vi inte använder lazy loading
  const standardQueryResult = useQuery({
    queryKey: ['teamActivities', teamId, userId, activityTypes, startDate, endDate, limit, offset, userIsTarget],
    queryFn: async () => {
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
    },
    enabled: enabled && !useLazyLoading
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
  
  // Hämta de senaste aktiviteterna (förkortad lista)
  const { data: latestActivities, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['teamActivitiesLatest', teamId],
    queryFn: async () => {
      const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
      const result = await getTeamActivitiesUseCase.getLatestActivities(teamId, 5);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    enabled
  });
  
  // Hämta aktivitetsstatistik
  const { data: activityStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['teamActivityStats', teamId],
    queryFn: async () => {
      const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
      const result = await getTeamActivitiesUseCase.getActivityStats(teamId);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.value;
    },
    enabled
  });
  
  // Mutation för att skapa en ny aktivitet
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
    },
    onSuccess: () => {
      // Invalidera relevanta queries för att uppdatera data
      queryClient.invalidateQueries({ queryKey: ['teamActivities', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesInfinite', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesLatest', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivityStats', teamId] });
    }
  });
  
  // Hjälpfunktion för att skapa en aktivitet från en domänhändelse
  const createActivityFromEvent = async (
    performedBy: string,
    eventName: string,
    eventPayload: Record<string, any>
  ) => {
    const createTeamActivityUseCase = new CreateTeamActivityUseCase(teamActivityRepository);
    const result = await createTeamActivityUseCase.createFromDomainEvent(
      teamId,
      performedBy,
      eventName,
      eventPayload
    );
    
    if (result.isOk()) {
      // Invalidera queries för att uppdatera data
      queryClient.invalidateQueries({ queryKey: ['teamActivities', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesInfinite', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesLatest', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivityStats', teamId] });
    }
    
    return result;
  };
  
  // Hjälpfunktion för att hämta nästa sida av aktiviteter
  const fetchNextPage = async () => {
    if (useLazyLoading) {
      return infiniteQueryResult.fetchNextPage();
    } else if (hasMore) {
      return queryClient.fetchQuery({
        queryKey: ['teamActivities', teamId, userId, activityTypes, startDate, endDate, limit, offset + limit, userIsTarget],
        queryFn: async () => {
          const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
          const result = await getTeamActivitiesUseCase.execute({
            teamId,
            userId,
            activityTypes,
            startDate,
            endDate,
            limit,
            offset: offset + limit,
            userIsTarget
          });
          
          if (result.isErr()) {
            throw new Error(result.error);
          }
          
          return result.value;
        }
      });
    }
    
    return Promise.resolve(null);
  };
  
  // Hjälpfunktion för att filtrera aktiviteter efter typ
  const filterByType = (type: ActivityType): UseTeamActivitiesResult => {
    return useTeamActivities({
      teamId,
      userId,
      activityTypes: [type],
      startDate,
      endDate,
      limit,
      offset: 0,
      userIsTarget,
      enabled: true,
      useLazyLoading
    });
  };
  
  return {
    activities,
    total,
    hasMore,
    latestActivities: latestActivities || [],
    activityStats: activityStats || {},
    isLoading: useLazyLoading ? infiniteQueryResult.isLoading : standardQueryResult.isLoading,
    isLoadingMore: useLazyLoading ? infiniteQueryResult.isFetchingNextPage : false,
    isLoadingLatest,
    isLoadingStats,
    error: useLazyLoading 
      ? infiniteQueryResult.error as Error | null 
      : standardQueryResult.error as Error | null,
    refetch: useLazyLoading ? infiniteQueryResult.refetch : standardQueryResult.refetch,
    createActivity: createActivityMutation.mutate,
    createActivityFromEvent,
    fetchNextPage,
    filterByType
  };
} 