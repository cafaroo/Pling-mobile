import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { 
  getGoals, 
  getGoalById, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  updateGoalProgress,
  addMilestone,
  updateMilestone,
  getUserGoalStats,
  getTeamGoalStats,
  createGoalRelation,
  deleteGoalRelation,
  getRelatedGoals,
  ServiceResponse
} from '@/services/goalService';
import { 
  Goal, 
  GoalFilter, 
  GoalQueryResult, 
  CreateGoalInput, 
  UpdateGoalInput, 
  UpdateGoalProgressInput,
  Milestone,
  UserGoalStats,
  TeamGoalStats,
  GoalRelation
} from '@/types/goal';

/**
 * Hook för att hämta mål baserat på filter
 */
export function useGoals(
  filter: GoalFilter = {},
  options = {}
): UseQueryResult<GoalQueryResult, Error> {
  return useQuery({
    queryKey: ['goals', filter],
    queryFn: () => getGoals(filter)
      .then(response => {
        if (response.error) throw new Error(response.error);
        return response.data!;
      }),
    ...options
  });
}

/**
 * Hook för att hämta ett specifikt mål
 */
export function useGoal(
  goalId: string | undefined,
  options = {}
): UseQueryResult<Goal, Error> {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => getGoalById(goalId!)
      .then(response => {
        if (response.error) throw new Error(response.error);
        return response.data!;
      }),
    enabled: !!goalId,
    ...options
  });
}

/**
 * Hook för att hämta användarstatistik
 */
export function useUserGoalStats(
  userId: string | undefined,
  options = {}
): UseQueryResult<UserGoalStats, Error> {
  return useQuery({
    queryKey: ['goalStats', 'user', userId],
    queryFn: () => getUserGoalStats(userId!)
      .then(response => {
        if (response.error) throw new Error(response.error);
        return response.data!;
      }),
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook för att hämta teamstatistik
 */
export function useTeamGoalStats(
  teamId: string | undefined,
  options = {}
): UseQueryResult<TeamGoalStats, Error> {
  return useQuery({
    queryKey: ['goalStats', 'team', teamId],
    queryFn: () => getTeamGoalStats(teamId!)
      .then(response => {
        if (response.error) throw new Error(response.error);
        return response.data!;
      }),
    enabled: !!teamId,
    ...options
  });
}

/**
 * Hook för att hämta relaterade mål
 */
export function useRelatedGoals(
  goalId: string | undefined,
  options = {}
): UseQueryResult<Goal[], Error> {
  return useQuery({
    queryKey: ['goals', 'related', goalId],
    queryFn: () => getRelatedGoals(goalId!)
      .then(response => {
        if (response.error) throw new Error(response.error);
        return response.data!;
      }),
    enabled: !!goalId,
    ...options
  });
}

/**
 * Hook för att skapa ett nytt mål
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newGoal: CreateGoalInput) => 
      createGoal(newGoal)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    onSuccess: (data, variables) => {
      // Invalidera relaterade queries
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Om det är ett team-mål, invalidera teamStats
      if (variables.scope === 'team' && variables.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['goalStats', 'team', variables.team_id] 
        });
      }
      
      // Invalidera användarstats för skaparen
      queryClient.invalidateQueries({ 
        queryKey: ['goalStats', 'user', data.created_by] 
      });
    }
  });
}

/**
 * Hook för att uppdatera ett mål
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: UpdateGoalInput }) => 
      updateGoal(goalId, updates)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    // Optimistisk uppdatering
    onMutate: async ({ goalId, updates }) => {
      // Avbryt utestående förfrågningar
      await queryClient.cancelQueries({ queryKey: ['goal', goalId] });
      
      // Spara tidigare tillstånd
      const previousGoal = queryClient.getQueryData<Goal>(['goal', goalId]);
      
      // Uppdatera cachen optimistiskt
      if (previousGoal) {
        queryClient.setQueryData<Goal>(['goal', goalId], {
          ...previousGoal,
          ...updates,
          updated_at: new Date().toISOString()
        });
      }
      
      return { previousGoal };
    },
    
    // Om det blir fel, återställ till tidigare tillstånd
    onError: (error, { goalId }, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(['goal', goalId], context.previousGoal);
      }
    },
    
    // Vid framgång, invalidera cachade queries
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Om det är ett team-mål, invalidera teamStats
      if (data.scope === 'team' && data.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['goalStats', 'team', data.team_id] 
        });
      }
      
      // Invalidera användarstats
      if (data.assignee_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['goalStats', 'user', data.assignee_id] 
        });
      }
      
      queryClient.invalidateQueries({ 
        queryKey: ['goalStats', 'user', data.created_by] 
      });
    }
  });
}

/**
 * Hook för att uppdatera framsteg för ett mål
 */
export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: UpdateGoalProgressInput) => 
      updateGoalProgress(input)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    // Optimistisk uppdatering
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['goal', input.goalId] });
      
      const previousGoal = queryClient.getQueryData<Goal>(['goal', input.goalId]);
      
      if (previousGoal) {
        queryClient.setQueryData<Goal>(['goal', input.goalId], {
          ...previousGoal,
          current: input.progress,
          updated_at: new Date().toISOString(),
          // Uppdatera status om målet är klart
          status: input.progress >= previousGoal.target ? 'completed' : previousGoal.status
        });
      }
      
      return { previousGoal };
    },
    
    onError: (error, input, context) => {
      if (context?.previousGoal) {
        queryClient.setQueryData(['goal', input.goalId], context.previousGoal);
      }
    },
    
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      if (data.scope === 'team' && data.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['goalStats', 'team', data.team_id] 
        });
      }
      
      if (data.assignee_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['goalStats', 'user', data.assignee_id] 
        });
      }
      
      queryClient.invalidateQueries({ 
        queryKey: ['goalStats', 'user', data.created_by] 
      });
    }
  });
}

/**
 * Hook för att ta bort ett mål
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (goalId: string) => 
      deleteGoal(goalId)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    onSuccess: (_, goalId) => {
      // Vi behöver veta scope och team_id för att invalidera rätt queries
      const goal = queryClient.getQueryData<Goal>(['goal', goalId]);
      
      queryClient.removeQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      if (goal) {
        if (goal.scope === 'team' && goal.team_id) {
          queryClient.invalidateQueries({ 
            queryKey: ['goalStats', 'team', goal.team_id] 
          });
        }
        
        if (goal.assignee_id) {
          queryClient.invalidateQueries({ 
            queryKey: ['goalStats', 'user', goal.assignee_id] 
          });
        }
        
        queryClient.invalidateQueries({ 
          queryKey: ['goalStats', 'user', goal.created_by] 
        });
      }
    }
  });
}

/**
 * Hook för att lägga till en milstolpe
 */
export function useAddMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      goalId, 
      milestone 
    }: { 
      goalId: string; 
      milestone: Omit<Milestone, 'id' | 'goal_id' | 'created_at' | 'is_completed' | 'completed_at' | 'order'> 
    }) => 
      addMilestone(goalId, milestone)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    onSuccess: (data, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    }
  });
}

/**
 * Hook för att uppdatera en milstolpe
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      milestoneId, 
      updates 
    }: { 
      milestoneId: string; 
      updates: Partial<Omit<Milestone, 'id' | 'goal_id' | 'created_at'>> 
    }) => 
      updateMilestone(milestoneId, updates)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    onSuccess: (data) => {
      // Milstone innehåller goal_id, så vi kan invalidera rätt goal
      queryClient.invalidateQueries({ queryKey: ['goal', data.goal_id] });
    }
  });
}

/**
 * Hook för att skapa relation mellan mål
 */
export function useCreateGoalRelation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (relation: Omit<GoalRelation, 'createdAt'>) => 
      createGoalRelation(relation)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    onSuccess: (data) => {
      // Invalidera relaterade mål
      queryClient.invalidateQueries({ 
        queryKey: ['goals', 'related', data.sourceGoalId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['goals', 'related', data.targetGoalId] 
      });
    }
  });
}

/**
 * Hook för att ta bort relation mellan mål
 */
export function useDeleteGoalRelation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sourceGoalId, targetGoalId }: { sourceGoalId: string; targetGoalId: string }) => 
      deleteGoalRelation(sourceGoalId, targetGoalId)
        .then(response => {
          if (response.error) throw new Error(response.error);
          return response.data!;
        }),
    
    onSuccess: (_, { sourceGoalId, targetGoalId }) => {
      // Invalidera relaterade mål
      queryClient.invalidateQueries({ 
        queryKey: ['goals', 'related', sourceGoalId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['goals', 'related', targetGoalId] 
      });
    }
  });
} 