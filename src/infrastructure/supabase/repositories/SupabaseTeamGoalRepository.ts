import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamGoal, GoalStatus, TeamGoalProps, TeamGoalAssignment } from '@/domain/team/entities/TeamGoal';
import { TeamGoalRepository, TeamGoalFilter } from '@/domain/team/repositories/TeamGoalRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/infrastructure/supabase/types';
import { DomainEventPublisher } from '@/domain/core/events/DomainEventPublisher';

interface TeamGoalRow {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  start_date: string;
  due_date: string | null;
  status: string;
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TeamGoalAssignmentRow {
  goal_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string;
}

export class SupabaseTeamGoalRepository implements TeamGoalRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  private mapRowToEntity(
    row: TeamGoalRow,
    assignments: TeamGoalAssignmentRow[] = []
  ): TeamGoal {
    const props: TeamGoalProps = {
      id: new UniqueId(row.id),
      teamId: new UniqueId(row.team_id),
      title: row.title,
      description: row.description ?? undefined,
      startDate: new Date(row.start_date),
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      status: row.status as GoalStatus,
      progress: row.progress,
      createdBy: new UniqueId(row.created_by),
      assignments: assignments.map(a => ({
        userId: new UniqueId(a.user_id),
        assignedAt: new Date(a.assigned_at),
        assignedBy: new UniqueId(a.assigned_by)
      })),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    const goal = TeamGoal['new'](props); // Använder privat konstruktor
    return goal;
  }

  private async getAssignments(goalId: string): Promise<TeamGoalAssignmentRow[]> {
    const { data, error } = await this.supabase
      .from('team_goal_assignments')
      .select('*')
      .eq('goal_id', goalId);

    if (error) throw error;
    return data;
  }

  async save(goal: TeamGoal): Promise<Result<void, Error>> {
    try {
      const { error: goalError } = await this.supabase
        .from('team_goals')
        .upsert({
          id: goal.id.toString(),
          team_id: goal.teamId.toString(),
          title: goal.title,
          description: goal.description,
          start_date: goal.startDate.toISOString(),
          due_date: goal.dueDate?.toISOString(),
          status: goal.status,
          progress: goal.progress,
          created_by: goal.createdBy.toString(),
          created_at: goal.props.createdAt?.toISOString(),
          updated_at: goal.props.updatedAt?.toISOString()
        });

      if (goalError) throw goalError;

      // Hantera tilldelningar
      const currentAssignments = await this.getAssignments(goal.id.toString());
      const newAssignments = goal.assignments;

      // Ta bort borttagna tilldelningar
      const assignmentsToRemove = currentAssignments.filter(
        current => !newAssignments.some(
          newAssign => newAssign.userId.toString() === current.user_id
        )
      );

      if (assignmentsToRemove.length > 0) {
        const { error: removeError } = await this.supabase
          .from('team_goal_assignments')
          .delete()
          .in('goal_id', assignmentsToRemove.map(a => a.goal_id));

        if (removeError) throw removeError;
      }

      // Lägg till nya tilldelningar
      const assignmentsToAdd = newAssignments.filter(
        newAssign => !currentAssignments.some(
          current => current.user_id === newAssign.userId.toString()
        )
      );

      if (assignmentsToAdd.length > 0) {
        const { error: addError } = await this.supabase
          .from('team_goal_assignments')
          .insert(
            assignmentsToAdd.map(a => ({
              goal_id: goal.id.toString(),
              user_id: a.userId.toString(),
              assigned_at: a.assignedAt.toISOString(),
              assigned_by: a.assignedBy.toString()
            }))
          );

        if (addError) throw addError;
      }

      // Publicera domänhändelser
      goal.domainEvents.forEach(event => this.eventPublisher.publish(event));
      
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findById(id: UniqueId): Promise<Result<TeamGoal | null, Error>> {
    try {
      const { data: goal, error } = await this.supabase
        .from('team_goals')
        .select('*')
        .eq('id', id.toString())
        .single();

      if (error) throw error;
      if (!goal) return Result.success(null);

      const assignments = await this.getAssignments(goal.id);
      return Result.success(this.mapRowToEntity(goal, assignments));
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>> {
    try {
      const { data: goals, error } = await this.supabase
        .from('team_goals')
        .select('*')
        .eq('team_id', teamId.toString());

      if (error) throw error;

      const goalsWithAssignments = await Promise.all(
        goals.map(async goal => {
          const assignments = await this.getAssignments(goal.id);
          return this.mapRowToEntity(goal, assignments);
        })
      );

      return Result.success(goalsWithAssignments);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findByFilter(filter: TeamGoalFilter): Promise<Result<TeamGoal[], Error>> {
    try {
      let query = this.supabase.from('team_goals').select('*');

      if (filter.teamId) {
        query = query.eq('team_id', filter.teamId.toString());
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.startDateFrom) {
        query = query.gte('start_date', filter.startDateFrom.toISOString());
      }
      if (filter.startDateTo) {
        query = query.lte('start_date', filter.startDateTo.toISOString());
      }
      if (filter.dueDateFrom) {
        query = query.gte('due_date', filter.dueDateFrom.toISOString());
      }
      if (filter.dueDateTo) {
        query = query.lte('due_date', filter.dueDateTo.toISOString());
      }
      if (filter.createdBy) {
        query = query.eq('created_by', filter.createdBy.toString());
      }

      const { data: goals, error } = await query;

      if (error) throw error;

      let filteredGoals = goals;

      // Filtrera på tilldelade användare om det behövs
      if (filter.assignedToUserId) {
        const { data: assignments } = await this.supabase
          .from('team_goal_assignments')
          .select('goal_id')
          .eq('user_id', filter.assignedToUserId.toString());

        if (assignments) {
          const assignedGoalIds = new Set(assignments.map(a => a.goal_id));
          filteredGoals = goals.filter(g => assignedGoalIds.has(g.id));
        }
      }

      const goalsWithAssignments = await Promise.all(
        filteredGoals.map(async goal => {
          const assignments = await this.getAssignments(goal.id);
          return this.mapRowToEntity(goal, assignments);
        })
      );

      return Result.success(goalsWithAssignments);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, Error>> {
    try {
      const { error } = await this.supabase
        .from('team_goals')
        .delete()
        .eq('id', id.toString());

      if (error) throw error;
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async findActiveByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>> {
    return this.findByFilter({
      teamId,
      status: GoalStatus.IN_PROGRESS
    });
  }

  async findCompletedByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>> {
    return this.findByFilter({
      teamId,
      status: GoalStatus.COMPLETED
    });
  }

  async findAssignedToUser(userId: UniqueId): Promise<Result<TeamGoal[], Error>> {
    return this.findByFilter({
      assignedToUserId: userId
    });
  }

  async findOverdueByTeamId(teamId: UniqueId): Promise<Result<TeamGoal[], Error>> {
    try {
      const { data: goals, error } = await this.supabase
        .from('team_goals')
        .select('*')
        .eq('team_id', teamId.toString())
        .lt('due_date', new Date().toISOString())
        .neq('status', GoalStatus.COMPLETED)
        .neq('status', GoalStatus.CANCELLED);

      if (error) throw error;

      const goalsWithAssignments = await Promise.all(
        goals.map(async goal => {
          const assignments = await this.getAssignments(goal.id);
          return this.mapRowToEntity(goal, assignments);
        })
      );

      return Result.success(goalsWithAssignments);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getTeamGoalStats(teamId: UniqueId): Promise<Result<{
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    averageProgress: number;
  }, Error>> {
    try {
      const { data: goals, error } = await this.supabase
        .from('team_goals')
        .select('*')
        .eq('team_id', teamId.toString());

      if (error) throw error;

      const now = new Date();
      const stats = {
        total: goals.length,
        completed: goals.filter(g => g.status === GoalStatus.COMPLETED).length,
        inProgress: goals.filter(g => g.status === GoalStatus.IN_PROGRESS).length,
        overdue: goals.filter(g => 
          g.due_date && 
          new Date(g.due_date) < now && 
          g.status !== GoalStatus.COMPLETED &&
          g.status !== GoalStatus.CANCELLED
        ).length,
        averageProgress: goals.reduce((acc, g) => acc + g.progress, 0) / goals.length || 0
      };

      return Result.success(stats);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
} 