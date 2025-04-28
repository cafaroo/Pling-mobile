import { supabase } from './supabaseClient';
import { Goal, GoalMilestone, GoalStatus, GoalType, GoalPeriod, GoalAssigneeType } from '@/types';

type CreateGoalData = {
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  startDate: Date;
  endDate: Date;
  period: GoalPeriod;
  userId?: string;
  teamId?: string;
  assigneeId?: string;
  assigneeType?: GoalAssigneeType;
  milestones?: {
    title: string;
    targetValue: number;
    reward?: string;
  }[];
};

// Create a new goal
export const createGoal = async (data: CreateGoalData): Promise<Goal | null> => {
  try {
    // Insert goal
    const { data: goal, error } = await supabase
      .from('goals')
      .insert({
        title: data.title,
        description: data.description,
        type: data.type,
        target_value: data.targetValue,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        period: data.period,
        user_id: data.userId,
        team_id: data.teamId,
        assignee_id: data.assigneeId,
        assignee_type: data.assigneeType,
        created_by: await supabase.auth.getUser().then(res => res.data.user?.id)
      })
      .select()
      .single();

    if (error) throw error;

    // Insert milestones if provided
    if (data.milestones && data.milestones.length > 0) {
      const milestonesToInsert = data.milestones.map(milestone => ({
        goal_id: goal.id,
        title: milestone.title,
        target_value: milestone.targetValue,
        reward: milestone.reward
      }));

      const { error: milestoneError } = await supabase
        .from('goal_milestones')
        .insert(milestonesToInsert);

      if (milestoneError) throw milestoneError;
    }

    // Return formatted goal
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      startDate: goal.start_date,
      endDate: goal.end_date,
      period: goal.period,
      status: goal.status,
      userId: goal.user_id,
      teamId: goal.team_id,
      assigneeId: goal.assignee_id,
      assigneeType: goal.assignee_type,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      createdBy: goal.created_by,
      progress: 0
    };
  } catch (error) {
    console.error('Error creating goal:', error);
    return null;
  }
};

// Get user goals
export const getUserGoals = async (userId: string, status?: GoalStatus): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_goals', { 
        p_user_id: userId,
        p_status: status
      });

    if (error) throw error;

    return data.map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      startDate: goal.start_date,
      endDate: goal.end_date,
      period: goal.period,
      status: goal.status,
      userId: userId,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      createdBy: userId,
      progress: goal.progress,
      daysRemaining: goal.days_remaining,
      milestonesCount: goal.milestones_count,
      completedMilestones: goal.completed_milestones
    }));
  } catch (error) {
    console.error('Error getting user goals:', error);
    return [];
  }
};

// Get team goals
export const getTeamGoals = async (teamId: string, status?: GoalStatus): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_team_goals', { 
        p_team_id: teamId,
        p_status: status
      });

    if (error) throw error;

    return data.map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      startDate: goal.start_date,
      endDate: goal.end_date,
      period: goal.period,
      status: goal.status,
      teamId: teamId,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      createdBy: goal.created_by,
      createdByName: goal.created_by_name,
      progress: goal.progress,
      daysRemaining: goal.days_remaining,
      milestonesCount: goal.milestones_count,
      completedMilestones: goal.completed_milestones
    }));
  } catch (error) {
    console.error('Error getting team goals:', error);
    return [];
  }
};

// Get team member goals
export const getTeamMemberGoals = async (teamId: string, assigneeId: string, status?: GoalStatus): Promise<Goal[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_team_member_goals', { 
        p_team_id: teamId,
        p_assignee_id: assigneeId,
        p_status: status
      });

    if (error) throw error;

    return data.map((goal: any) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      startDate: goal.start_date,
      endDate: goal.end_date,
      period: goal.period,
      status: goal.status,
      teamId: goal.team_id,
      assigneeId: goal.assignee_id,
      assigneeType: goal.assignee_type,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      createdBy: goal.created_by,
      createdByName: goal.created_by_name,
      assigneeName: goal.assignee_name,
      progress: goal.progress,
      daysRemaining: goal.days_remaining,
      milestonesCount: goal.milestones_count,
      completedMilestones: goal.completed_milestones
    }));
  } catch (error) {
    console.error('Error getting team member goals:', error);
    return [];
  }
};

// Get goal details with milestones
export const getGoalDetails = async (goalId: string): Promise<Goal | null> => {
  try {
    // Get goal
    const { data: goal, error } = await supabase
      .from('goals')
      .select(`
        *,
        profiles:created_by (name)
      `)
      .eq('id', goalId)
      .single();

    if (error) throw error;

    // Get milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('goal_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('target_value', { ascending: true });

    if (milestonesError) throw milestonesError;

    // Calculate progress
    const progress = goal.target_value > 0 
      ? Math.min(100, (goal.current_value / goal.target_value) * 100)
      : 0;

    // Format milestones
    const formattedMilestones: GoalMilestone[] = milestones.map(milestone => ({
      id: milestone.id,
      goalId: milestone.goal_id,
      title: milestone.title,
      targetValue: milestone.target_value,
      reward: milestone.reward,
      isCompleted: milestone.is_completed,
      completedAt: milestone.completed_at
    }));

    // Return formatted goal with milestones
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      startDate: goal.start_date,
      endDate: goal.end_date,
      period: goal.period,
      status: goal.status,
      userId: goal.user_id,
      teamId: goal.team_id,
      assigneeId: goal.assignee_id,
      assigneeType: goal.assignee_type,
      assigneeName: goal.profiles_assignee?.name,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      createdBy: goal.created_by,
      createdByName: goal.profiles?.name,
      milestones: formattedMilestones,
      progress: progress
    };
  } catch (error) {
    console.error('Error getting goal details:', error);
    return null;
  }
};

// Update goal status
export const updateGoalStatus = async (goalId: string, status: GoalStatus): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('goals')
      .update({ status })
      .eq('id', goalId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating goal status:', error);
    return false;
  }
};

// Delete goal
export const deleteGoal = async (goalId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
};

// Add manual goal entry
export const addGoalEntry = async (goalId: string, value: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('goal_entries')
      .insert({
        goal_id: goalId,
        value,
        source_type: 'manual'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding goal entry:', error);
    return false;
  }
};

// Get goal entries
export const getGoalEntries = async (goalId: string, limit = 10): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('goal_entries')
      .select(`
        *,
        sales:source_id (*)
      `)
      .eq('goal_id', goalId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting goal entries:', error);
    return [];
  }
};