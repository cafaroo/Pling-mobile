import { User } from './user';

/**
 * Definierar scope för ett mål - om det är individuellt eller teambaserat
 */
export type GoalScope = 'individual' | 'team';

/**
 * Status för ett mål
 */
export type GoalStatus = 'active' | 'completed' | 'canceled' | 'paused';

/**
 * Måltyp som definierar vilken kategori målet tillhör
 */
export type GoalType = 'performance' | 'learning' | 'habit' | 'project' | 'other';

/**
 * Svårighetsgrad för ett mål
 */
export type GoalDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Grundläggande milstolpe för ett mål
 */
export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  target_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  order: number;
}

/**
 * Tagg för att kategorisera mål
 */
export interface GoalTag {
  id: string;
  name: string;
  color: string;
}

/**
 * Huvudinterface för ett mål
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  difficulty: GoalDifficulty;
  target: number;            // Målvärde (t.ex. 100%)
  current: number;           // Aktuellt värde (t.ex. 75%)
  unit?: string;             // Enhet (t.ex. %, km, timmar)
  deadline?: string;         // ISO-datum för deadline
  start_date: string;        // ISO-datum för startdatum
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  created_by: string;        // Användar-ID för skaparen
  
  // Domänspecifika fält
  scope: GoalScope;          // 'individual' eller 'team'
  team_id?: string;          // Används bara för team-mål
  assignee_id?: string;      // Person/personer med ansvar för målet
  parent_goal_id?: string;   // Ett mål kan vara relaterat till ett annat mål
  
  // Relationer
  milestones?: Milestone[];  // Delmål
  tags?: GoalTag[];          // Kategorier/taggar
  contributors?: string[];   // Lista på användar-IDs som bidrar
}

/**
 * Interface för att skapa ett nytt mål (saknar genererade fält)
 */
export type CreateGoalInput = Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'current'> & {
  current?: number;          // Valfritt vid skapande
  end_date: string;          // Obligatoriskt slutdatum
};

/**
 * Interface för att uppdatera ett mål (alla fält är valfria)
 */
export type UpdateGoalInput = Partial<Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'scope'>>;

/**
 * Interface för att uppdatera målframsteg
 */
export interface UpdateGoalProgressInput {
  goalId: string;
  progress: number;          // Nytt procentuellt värde
  comment?: string;          // Valfri kommentar
}

/**
 * Interface för målframstegslogg
 */
export interface GoalProgressLog {
  id: string;
  goal_id: string;
  previous_value: number;
  new_value: number;
  changed_by: string;        // Användar-ID
  comment?: string;
  created_at: string;
}

/**
 * Resultat från filtrering av mål
 */
export interface GoalQueryResult {
  goals: Goal[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Filter för målsökning
 */
export interface GoalFilter {
  scope?: GoalScope;
  teamId?: string;
  userId?: string;
  status?: GoalStatus[];
  type?: GoalType[];
  search?: string;
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  sortBy?: 'deadline' | 'progress' | 'created_at' | 'difficulty';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

/**
 * Relationstyp mellan mål
 */
export type GoalRelationType = 'parent' | 'child' | 'related';

/**
 * Interface för relation mellan mål
 */
export interface GoalRelation {
  sourceGoalId: string;
  targetGoalId: string;
  type: GoalRelationType;
  createdAt: string;
}

/**
 * Användarstatistik för mål
 */
export interface UserGoalStats {
  userId: string;
  completedGoals: number;
  activeGoals: number;
  averageCompletion: number;
  teamContributions: number;
  lastActivity?: string;
}

/**
 * Teamstatistik för mål
 */
export interface TeamGoalStats {
  teamId: string;
  completedGoals: number;
  activeGoals: number;
  averageCompletion: number;
  topContributors: {
    userId: string;
    name?: string;
    avatar?: string;
    contributions: number;
  }[];
  mostActiveDay?: string;
} 