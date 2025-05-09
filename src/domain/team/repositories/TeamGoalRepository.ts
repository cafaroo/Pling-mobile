import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamGoal, GoalStatus } from '../entities/TeamGoal';

export interface TeamGoalFilter {
  teamId?: UniqueId;
  status?: GoalStatus;
  assignedToUserId?: UniqueId;
  createdBy?: UniqueId;
  startDateFrom?: Date;
  startDateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface TeamGoalRepository {
  save(goal: TeamGoal): Promise<Result<void, Error>>;
  findById(id: UniqueId): Promise<Result<TeamGoal | null, Error>>;
  findByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>>;
  findByFilter(filter: TeamGoalFilter): Promise<Result<TeamGoal[], Error>>;
  delete(id: UniqueId): Promise<Result<void, Error>>;
  
  // Specialiserade sökmetoder
  findActiveByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>>;
  findCompletedByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>>;
  findAssignedToUser(userId: UniqueId): Promise<Result<TeamGoal[], Error>>;
  findOverdueByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>>;
  
  // Statistikmetoder
  getTeamGoalStats(teamId: UniqueId): Promise<Result<{
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    averageProgress: number;
  }, Error>>;
} 