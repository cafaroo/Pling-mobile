import { useQuery } from '@tanstack/react-query';
import { getUserGoals, getTeamGoals } from '../services/goalService';
import type { Goal, GoalStatus } from '../types';

interface UseGoalsOptions {
  userId?: string;
  teamId?: string;
  status?: GoalStatus;
}

export function useGoals({ userId, teamId, status }: UseGoalsOptions) {
  return useQuery({
    queryKey: ['goals', { userId, teamId, status }],
    queryFn: () => {
      if (teamId) {
        return getTeamGoals(teamId, status);
      }
      return getUserGoals(userId || '', status);
    },
    enabled: Boolean(userId || teamId),
  });
} 