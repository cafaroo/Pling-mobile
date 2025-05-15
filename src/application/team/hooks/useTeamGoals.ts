import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamGoal, GoalStatus, TeamGoalCreateProps } from '@/domain/team/entities/TeamGoal';
import { TeamGoalFilter } from '@/domain/team/repositories/TeamGoalRepository';
import { UniqueId } from '@/domain/core/UniqueId';
import { useSupabaseTeamGoalRepository } from '@/infrastructure/supabase/hooks/useSupabaseTeamGoalRepository';
import { Result } from '@/shared/core/Result';

export const teamGoalsKeys = {
  all: ['team-goals'] as const,
  lists: () => [...teamGoalsKeys.all, 'list'] as const,
  list: (filters: TeamGoalFilter) => [...teamGoalsKeys.lists(), filters] as const,
  details: () => [...teamGoalsKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamGoalsKeys.details(), id] as const,
  stats: (teamId: string) => [...teamGoalsKeys.all, 'stats', teamId] as const,
};

export interface UseTeamGoalsOptions {
  teamId?: UniqueId;
  includeCompleted?: boolean;
  onlyActive?: boolean;
  assignedToUserId?: UniqueId;
  // Caching-alternativ
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number | false;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minuter
const DEFAULT_CACHE_TIME = 30 * 60 * 1000; // 30 minuter
const ACTIVE_REFETCH_INTERVAL = 30 * 1000; // 30 sekunder

export function useTeamGoals(options: UseTeamGoalsOptions = {}) {
  const repository = useSupabaseTeamGoalRepository();
  const queryClient = useQueryClient();

  const filter: TeamGoalFilter = {
    teamId: options.teamId,
    assignedToUserId: options.assignedToUserId,
    ...(options.onlyActive && { status: GoalStatus.IN_PROGRESS })
  };

  // Optimera caching-inställningar baserat på användningsfall
  const staleTime = options.staleTime ?? DEFAULT_STALE_TIME;
  const cacheTime = options.cacheTime ?? DEFAULT_CACHE_TIME;
  const refetchInterval = options.refetchInterval ?? 
    (options.onlyActive ? ACTIVE_REFETCH_INTERVAL : false);

  // Hämta mål baserat på filter
  const { data: goals, isLoading, error } = useQuery({
    queryKey: teamGoalsKeys.list(filter),
    queryFn: async () => {
      const result = await repository.findByFilter(filter);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime,
    cacheTime,
    refetchInterval,
    // Optimera revalidering
    refetchOnWindowFocus: options.onlyActive,
    refetchOnReconnect: true
  });

  // Skapa nytt mål med optimistisk uppdatering
  const createMutation = useMutation({
    mutationFn: async (props: TeamGoalCreateProps) => {
      const goalResult = TeamGoal.create(props);
      if (goalResult.isErr()) throw goalResult.error;

      const saveResult = await repository.save(goalResult.value);
      if (saveResult.isErr()) throw saveResult.error;

      return goalResult.value;
    },
    onMutate: async (newGoal) => {
      // Avbryt pågående hämtningar
      await queryClient.cancelQueries(teamGoalsKeys.list(filter));

      // Spara tidigare data
      const previousGoals = queryClient.getQueryData(teamGoalsKeys.list(filter));

      // Optimistiskt uppdatera cache
      const optimisticGoal = TeamGoal.create(newGoal);
      if (optimisticGoal.isOk()) {
        queryClient.setQueryData(
          teamGoalsKeys.list(filter),
          (old: TeamGoal[] = []) => [...old, optimisticGoal.value]
        );
      }

      return { previousGoals };
    },
    onError: (err, newGoal, context) => {
      // Återställ cache vid fel
      if (context?.previousGoals) {
        queryClient.setQueryData(teamGoalsKeys.list(filter), context.previousGoals);
      }
    },
    onSettled: () => {
      // Uppdatera alla relaterade queries
      queryClient.invalidateQueries(teamGoalsKeys.lists());
    }
  });

  // Uppdatera mål med optimistisk uppdatering
  const updateMutation = useMutation({
    mutationFn: async (goal: TeamGoal) => {
      const result = await repository.save(goal);
      if (result.isErr()) throw result.error;
      return goal;
    },
    onMutate: async (updatedGoal) => {
      await queryClient.cancelQueries(teamGoalsKeys.detail(updatedGoal.id.toString()));

      const previousGoal = queryClient.getQueryData(
        teamGoalsKeys.detail(updatedGoal.id.toString())
      );

      queryClient.setQueryData(
        teamGoalsKeys.detail(updatedGoal.id.toString()),
        updatedGoal
      );

      return { previousGoal };
    },
    onError: (err, updatedGoal, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(
          teamGoalsKeys.detail(updatedGoal.id.toString()),
          context.previousGoal
        );
      }
    },
    onSettled: (goal) => {
      if (goal) {
        queryClient.invalidateQueries(teamGoalsKeys.detail(goal.id.toString()));
        queryClient.invalidateQueries(teamGoalsKeys.lists());
      }
    }
  });

  // Ta bort mål med optimistisk uppdatering
  const deleteMutation = useMutation({
    mutationFn: async (goalId: UniqueId) => {
      const result = await repository.delete(goalId);
      if (result.isErr()) throw result.error;
    },
    onMutate: async (goalId) => {
      await queryClient.cancelQueries(teamGoalsKeys.list(filter));

      const previousGoals = queryClient.getQueryData(teamGoalsKeys.list(filter));

      queryClient.setQueryData(
        teamGoalsKeys.list(filter),
        (old: TeamGoal[] = []) => old.filter(g => !g.id.equals(goalId))
      );

      return { previousGoals };
    },
    onError: (err, goalId, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(teamGoalsKeys.list(filter), context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(teamGoalsKeys.lists());
    }
  });

  // Uppdatera målstatus med optimistisk uppdatering
  const updateStatusMutation = useMutation({
    mutationFn: async ({ goal, status }: { goal: TeamGoal; status: GoalStatus }) => {
      const result = goal.updateStatus(status);
      if (result.isErr()) throw result.error;

      const saveResult = await repository.save(goal);
      if (saveResult.isErr()) throw saveResult.error;

      return goal;
    },
    onMutate: async ({ goal, status }) => {
      await queryClient.cancelQueries(teamGoalsKeys.detail(goal.id.toString()));

      const previousGoal = queryClient.getQueryData(
        teamGoalsKeys.detail(goal.id.toString())
      );

      const updatedGoal = { ...goal };
      updatedGoal.updateStatus(status);

      queryClient.setQueryData(
        teamGoalsKeys.detail(goal.id.toString()),
        updatedGoal
      );

      return { previousGoal };
    },
    onError: (err, variables, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(
          teamGoalsKeys.detail(variables.goal.id.toString()),
          context.previousGoal
        );
      }
    },
    onSettled: (goal) => {
      if (goal) {
        queryClient.invalidateQueries(teamGoalsKeys.detail(goal.id.toString()));
        queryClient.invalidateQueries(teamGoalsKeys.lists());
      }
    }
  });

  // Uppdatera målframsteg med optimistisk uppdatering
  const updateProgressMutation = useMutation({
    mutationFn: async ({ goal, progress }: { goal: TeamGoal; progress: number }) => {
      const result = goal.updateProgress(progress);
      if (result.isErr()) throw result.error;

      const saveResult = await repository.save(goal);
      if (saveResult.isErr()) throw saveResult.error;

      return goal;
    },
    onMutate: async ({ goal, progress }) => {
      await queryClient.cancelQueries(teamGoalsKeys.detail(goal.id.toString()));

      const previousGoal = queryClient.getQueryData(
        teamGoalsKeys.detail(goal.id.toString())
      );

      const updatedGoal = { ...goal };
      updatedGoal.updateProgress(progress);

      queryClient.setQueryData(
        teamGoalsKeys.detail(goal.id.toString()),
        updatedGoal
      );

      return { previousGoal };
    },
    onError: (err, variables, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(
          teamGoalsKeys.detail(variables.goal.id.toString()),
          context.previousGoal
        );
      }
    },
    onSettled: (goal) => {
      if (goal) {
        queryClient.invalidateQueries(teamGoalsKeys.detail(goal.id.toString()));
        queryClient.invalidateQueries(teamGoalsKeys.lists());
      }
    }
  });

  // Tilldela medlem till mål med optimistisk uppdatering
  const assignMemberMutation = useMutation({
    mutationFn: async ({ 
      goal, 
      userId, 
      assignedBy 
    }: { 
      goal: TeamGoal; 
      userId: UniqueId; 
      assignedBy: UniqueId;
    }) => {
      const result = goal.assignMember(userId, assignedBy);
      if (result.isErr()) throw result.error;

      const saveResult = await repository.save(goal);
      if (saveResult.isErr()) throw saveResult.error;

      return goal;
    },
    onMutate: async ({ goal, userId, assignedBy }) => {
      await queryClient.cancelQueries(teamGoalsKeys.detail(goal.id.toString()));

      const previousGoal = queryClient.getQueryData(
        teamGoalsKeys.detail(goal.id.toString())
      );

      const updatedGoal = { ...goal };
      updatedGoal.assignMember(userId, assignedBy);

      queryClient.setQueryData(
        teamGoalsKeys.detail(goal.id.toString()),
        updatedGoal
      );

      return { previousGoal };
    },
    onError: (err, variables, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(
          teamGoalsKeys.detail(variables.goal.id.toString()),
          context.previousGoal
        );
      }
    },
    onSettled: (goal) => {
      if (goal) {
        queryClient.invalidateQueries(teamGoalsKeys.detail(goal.id.toString()));
        queryClient.invalidateQueries(teamGoalsKeys.lists());
      }
    }
  });

  // Ta bort medlem från mål med optimistisk uppdatering
  const unassignMemberMutation = useMutation({
    mutationFn: async ({ 
      goal, 
      userId 
    }: { 
      goal: TeamGoal; 
      userId: UniqueId;
    }) => {
      const result = goal.unassignMember(userId);
      if (result.isErr()) throw result.error;

      const saveResult = await repository.save(goal);
      if (saveResult.isErr()) throw saveResult.error;

      return goal;
    },
    onMutate: async ({ goal, userId }) => {
      await queryClient.cancelQueries(teamGoalsKeys.detail(goal.id.toString()));

      const previousGoal = queryClient.getQueryData(
        teamGoalsKeys.detail(goal.id.toString())
      );

      const updatedGoal = { ...goal };
      updatedGoal.unassignMember(userId);

      queryClient.setQueryData(
        teamGoalsKeys.detail(goal.id.toString()),
        updatedGoal
      );

      return { previousGoal };
    },
    onError: (err, variables, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(
          teamGoalsKeys.detail(variables.goal.id.toString()),
          context.previousGoal
        );
      }
    },
    onSettled: (goal) => {
      if (goal) {
        queryClient.invalidateQueries(teamGoalsKeys.detail(goal.id.toString()));
        queryClient.invalidateQueries(teamGoalsKeys.lists());
      }
    }
  });

  return {
    goals,
    isLoading,
    error,
    createGoal: createMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    assignMember: assignMemberMutation.mutateAsync,
    unassignMember: unassignMemberMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Hook för att hämta ett specifikt mål med optimerad caching
export function useTeamGoal(
  goalId: UniqueId,
  options: { staleTime?: number; cacheTime?: number } = {}
) {
  const repository = useSupabaseTeamGoalRepository();

  return useQuery({
    queryKey: teamGoalsKeys.detail(goalId.toString()),
    queryFn: async () => {
      const result = await repository.findById(goalId);
      if (result.isErr()) throw result.error;
      if (!result.value) throw new Error('Målet hittades inte');
      return result.value;
    },
    staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
    cacheTime: options.cacheTime ?? DEFAULT_CACHE_TIME
  });
}

// Hook för att hämta målstatistik med optimerad caching
export function useTeamGoalStats(
  teamId: UniqueId,
  options: { staleTime?: number; cacheTime?: number; refetchInterval?: number } = {}
) {
  const repository = useSupabaseTeamGoalRepository();

  return useQuery({
    queryKey: teamGoalsKeys.stats(teamId.toString()),
    queryFn: async () => {
      const result = await repository.getTeamGoalStats(teamId);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
    cacheTime: options.cacheTime ?? DEFAULT_CACHE_TIME,
    }
  });
} 