import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  enabled = true
}: UseTeamActivitiesOptions) {
  const queryClient = useQueryClient();
  const { teamActivityRepository } = useInfrastructure();
  
  // Hämta aktiviteter med filtrering och paginering
  const { data, isLoading, error, refetch } = useQuery({
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
      
      return result.getValue();
    },
    enabled
  });
  
  // Hämta de senaste aktiviteterna (förkortad lista)
  const { data: latestActivities, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['teamActivitiesLatest', teamId],
    queryFn: async () => {
      const getTeamActivitiesUseCase = new GetTeamActivitiesUseCase(teamActivityRepository);
      const result = await getTeamActivitiesUseCase.getLatestActivities(teamId, 5);
      
      if (result.isErr()) {
        throw new Error(result.error);
      }
      
      return result.getValue();
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
      
      return result.getValue();
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
      
      return result.getValue();
    },
    onSuccess: () => {
      // Invalidera relevanta queries för att uppdatera data
      queryClient.invalidateQueries({ queryKey: ['teamActivities', teamId] });
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
      queryClient.invalidateQueries({ queryKey: ['teamActivitiesLatest', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivityStats', teamId] });
    }
    
    return result;
  };
  
  // Hjälpfunktion för att hämta nästa sida av aktiviteter
  const fetchNextPage = () => {
    if (data && data.hasMore) {
      return useTeamActivities({
        teamId,
        userId,
        activityTypes,
        startDate,
        endDate,
        limit,
        offset: (offset || 0) + limit,
        userIsTarget,
        enabled: true
      });
    }
    return null;
  };
  
  // Hjälpfunktion för att filtrera aktiviteter efter typ
  const filterByType = (type: ActivityType) => {
    return useTeamActivities({
      teamId,
      userId,
      activityTypes: [type],
      startDate,
      endDate,
      limit,
      offset: 0,
      userIsTarget,
      enabled: true
    });
  };
  
  return {
    activities: data?.activities || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    latestActivities: latestActivities || [],
    activityStats: activityStats || {},
    isLoading,
    isLoadingLatest,
    isLoadingStats,
    error,
    refetch,
    createActivity: createActivityMutation.mutate,
    createActivityFromEvent,
    fetchNextPage,
    filterByType
  };
} 