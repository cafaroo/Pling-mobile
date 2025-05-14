import { supabase } from '@/lib/supabase';
import { 
  Goal, 
  GoalScope, 
  GoalStatus, 
  CreateGoalInput, 
  UpdateGoalInput, 
  UpdateGoalProgressInput,
  GoalFilter,
  GoalQueryResult,
  GoalRelation,
  UserGoalStats,
  TeamGoalStats,
  Milestone,
  GoalProgressLog
} from '@/types/goal';

/**
 * Standard service-svar för att hantera olika svarsscenarion
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'success' | 'error';
}

/**
 * Felhanteringsfunktion för service-anrop
 */
function handleServiceError(error: any, message = 'Ett fel uppstod'): ServiceResponse<any> {
  console.error('Goal service error:', error);
  return {
    data: null,
    error: message,
    status: 'error'
  };
}

/**
 * Hämta mål baserat på filter
 */
export async function getGoals(
  filter: GoalFilter = {}
): Promise<ServiceResponse<GoalQueryResult>> {
  try {
    const {
      scope,
      teamId,
      userId,
      status,
      type,
      search,
      tags,
      dateRange,
      sortBy = 'created_at',
      sortDirection = 'desc',
      page = 1,
      perPage = 10
    } = filter;

    // Första hämta mål baserat på filter
    let query = supabase
      .from('goals')
      .select('*', { count: 'exact' });

    // Applicera filtrering
    if (scope) {
      query = query.eq('scope', scope);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (userId) {
      // För individuella mål eller assignee
      query = query.or(`created_by.eq.${userId},assignee_id.eq.${userId}`);
    }

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    if (type && type.length > 0) {
      query = query.in('type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (dateRange) {
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from);
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to);
      }
    }

    // Applicera paginering
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // Sortering
    query = query.order(sortBy, { ascending: sortDirection === 'asc' });

    // Exekvera förfrågan
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    
    // Om inga mål hittades, returnera tom lista
    if (!data || data.length === 0) {
      return {
        data: {
          goals: [],
          total: 0,
          page,
          perPage
        },
        error: null,
        status: 'success'
      };
    }
    
    // Hämta goal IDs för att hämta relaterade data
    const goalIds = data.map(goal => goal.id);
    
    // Hämta milestones för dessa mål
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .in('goal_id', goalIds);
      
    if (milestonesError) throw milestonesError;
    
    // Hämta tags för dessa mål
    const { data: tagRelationsData, error: tagRelationsError } = await supabase
      .from('goal_tag_relations')
      .select('goal_id, tag_id, goal_tags(*)')
      .in('goal_id', goalIds);
      
    if (tagRelationsError) throw tagRelationsError;
    
    // Organisera milestones per goal
    const milestonesByGoalId = {};
    milestonesData?.forEach(milestone => {
      if (!milestonesByGoalId[milestone.goal_id]) {
        milestonesByGoalId[milestone.goal_id] = [];
      }
      milestonesByGoalId[milestone.goal_id].push(milestone);
    });
    
    // Organisera tags per goal
    const tagsByGoalId = {};
    tagRelationsData?.forEach(relation => {
      if (!tagsByGoalId[relation.goal_id]) {
        tagsByGoalId[relation.goal_id] = [];
      }
      tagsByGoalId[relation.goal_id].push(relation.goal_tags);
    });
    
    // Kombinera all data till slutligt resultat
    const formattedData = data.map(goal => ({
      ...goal,
      milestones: milestonesByGoalId[goal.id] || [],
      tags: tagsByGoalId[goal.id] || []
    }));

    // Formatera svar
    return {
      data: {
        goals: formattedData as Goal[],
        total: count || 0,
        page,
        perPage
      },
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte hämta mål');
  }
}

/**
 * Hämta ett specifikt mål med ID
 */
export async function getGoalById(goalId: string): Promise<ServiceResponse<Goal>> {
  try {
    // Hämta grunddata för målet
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error) throw error;
    
    // Hämta milestones
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .eq('goal_id', goalId);
      
    if (milestonesError) throw milestonesError;
    
    // Hämta tags
    const { data: tagRelationsData, error: tagRelationsError } = await supabase
      .from('goal_tag_relations')
      .select('goal_id, tag_id, goal_tags(*)')
      .eq('goal_id', goalId);
      
    if (tagRelationsError) throw tagRelationsError;

    // Transformera data för att matcha Goal-interfacet
    const formattedData = {
      ...data,
      milestones: milestonesData || [],
      tags: tagRelationsData?.map(relation => relation.goal_tags) || []
    };

    return {
      data: formattedData as Goal,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte hämta målet');
  }
}

/**
 * Skapa ett nytt mål
 */
export async function createGoal(goalInput: CreateGoalInput): Promise<ServiceResponse<Goal>> {
  try {
    // Extrahera tags för att hantera dem separat
    const { tags, milestones, ...goalData } = goalInput;

    // Sätt standardvärden för nya mål
    const newGoal = {
      ...goalData,
      current: goalInput.current || 0,
      status: goalInput.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Debugga data som skickas
    console.log('Skickar följande data till goals-tabellen:', newGoal);

    // Spara till databasen
    const { data, error } = await supabase
      .from('goals')
      .insert([newGoal])
      .select()
      .single();

    if (error) {
      console.error('SQL error vid skapande av goal:', error);
      throw error;
    }

    console.log('Skapat mål med data:', data);

    // Om milstolpar finns, skapa dem också
    if (milestones && milestones.length > 0) {
      const milestonesWithGoalId = milestones.map((milestone, index) => ({
        ...milestone,
        goal_id: data.id,
        is_completed: false,
        created_at: new Date().toISOString(),
        order: index
      }));

      const { error: milestoneError } = await supabase
        .from('milestones')
        .insert(milestonesWithGoalId);

      if (milestoneError) throw milestoneError;
    }

    // Om taggar finns, skapa relationer
    if (tags && tags.length > 0) {
      const tagRelations = tags.map(tag => ({
        goal_id: data.id,
        tag_id: tag.id
      }));

      const { error: tagError } = await supabase
        .from('goal_tag_relations')
        .insert(tagRelations);

      if (tagError) throw tagError;
    }

    return {
      data: data as Goal,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte skapa målet');
  }
}

/**
 * Uppdatera ett befintligt mål
 */
export async function updateGoal(
  goalId: string, 
  updates: UpdateGoalInput
): Promise<ServiceResponse<Goal>> {
  try {
    // Lägg till uppdateringsdatum
    const goalUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Uppdatera i databasen
    const { data, error } = await supabase
      .from('goals')
      .update(goalUpdates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as Goal,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte uppdatera målet');
  }
}

/**
 * Uppdatera framsteg för ett mål och skapa en loggpost
 */
export async function updateGoalProgress(
  input: UpdateGoalProgressInput
): Promise<ServiceResponse<Goal>> {
  try {
    // Först hämta aktuellt värde för att logga förändringen
    const { data: currentGoal, error: fetchError } = await supabase
      .from('goals')
      .select('current, target')
      .eq('id', input.goalId)
      .single();

    if (fetchError) throw fetchError;

    // Se till att progress är inom gränserna 0-target
    const progress = Math.min(Math.max(0, input.progress), currentGoal.target);

    // Uppdatera målets framsteg
    const { data, error } = await supabase
      .from('goals')
      .update({ 
        current: progress,
        updated_at: new Date().toISOString(),
        // Om progress är lika med target, ändra status till 'completed'
        status: progress >= currentGoal.target ? 'completed' as GoalStatus : undefined
      })
      .eq('id', input.goalId)
      .select()
      .single();

    if (error) throw error;

    // Skapa en loggpost för uppdateringen
    const progressLog: Partial<GoalProgressLog> = {
      goal_id: input.goalId,
      previous_value: currentGoal.current,
      new_value: progress,
      changed_by: data.assignee_id || data.created_by, // Använd assignee om det finns, annars skaparen
      comment: input.comment,
      created_at: new Date().toISOString()
    };

    const { error: logError } = await supabase
      .from('goal_progress_logs')
      .insert([progressLog]);

    if (logError) {
      console.error('Kunde inte skapa framstegslogg:', logError);
      // Vi fortsätter ändå eftersom huvuduppdateringen lyckades
    }

    return {
      data: data as Goal,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte uppdatera målframsteg');
  }
}

/**
 * Ta bort ett mål
 */
export async function deleteGoal(goalId: string): Promise<ServiceResponse<boolean>> {
  try {
    // Ta först bort relaterade data
    await Promise.all([
      supabase.from('milestones').delete().eq('goal_id', goalId),
      supabase.from('goal_tag_relations').delete().eq('goal_id', goalId),
      supabase.from('goal_progress_logs').delete().eq('goal_id', goalId)
    ]);

    // Ta sedan bort själva målet
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;

    return {
      data: true,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte ta bort målet');
  }
}

/**
 * Lägg till en milstolpe till ett mål
 */
export async function addMilestone(
  goalId: string, 
  milestone: Omit<Milestone, 'id' | 'goal_id' | 'created_at' | 'is_completed' | 'completed_at' | 'order'>
): Promise<ServiceResponse<Milestone>> {
  try {
    // Hämta nuvarande antal milstolpar för att bestämma ordning
    const { data: existingMilestones, error: countError } = await supabase
      .from('milestones')
      .select('id')
      .eq('goal_id', goalId);

    if (countError) throw countError;

    const order = existingMilestones ? existingMilestones.length : 0;

    // Skapa ny milstolpe
    const newMilestone = {
      ...milestone,
      goal_id: goalId,
      is_completed: false,
      created_at: new Date().toISOString(),
      order
    };

    const { data, error } = await supabase
      .from('milestones')
      .insert([newMilestone])
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as Milestone,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte lägga till milstolpe');
  }
}

/**
 * Uppdatera milstolpe
 */
export async function updateMilestone(
  milestoneId: string, 
  updates: Partial<Omit<Milestone, 'id' | 'goal_id' | 'created_at'>>
): Promise<ServiceResponse<Milestone>> {
  try {
    // Om vi markerar en milstolpe som klar, lägg till datum
    if (updates.is_completed) {
      updates.completed_at = new Date().toISOString();
    } else if (updates.is_completed === false) {
      // Om vi markerar en milstolpe som inte klar, ta bort completed_at
      updates.completed_at = null;
    }

    const { data, error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;

    return {
      data: data as Milestone,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte uppdatera milstolpe');
  }
}

/**
 * Hämta användarstatistik för mål
 */
export async function getUserGoalStats(userId: string): Promise<ServiceResponse<UserGoalStats>> {
  try {
    // Hämta antal avklarade mål
    const { data: completedGoals, error: completedError } = await supabase
      .from('goals')
      .select('id')
      .or(`created_by.eq.${userId},assignee_id.eq.${userId}`)
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // Hämta antal aktiva mål
    const { data: activeGoals, error: activeError } = await supabase
      .from('goals')
      .select('id')
      .or(`created_by.eq.${userId},assignee_id.eq.${userId}`)
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Hämta genomsnittlig progress för aktiva mål
    const { data: progressData, error: progressError } = await supabase
      .from('goals')
      .select('current, target')
      .or(`created_by.eq.${userId},assignee_id.eq.${userId}`)
      .eq('status', 'active');

    if (progressError) throw progressError;

    // Beräkna genomsnittlig avklaringsgrad
    let averageCompletion = 0;
    if (progressData && progressData.length > 0) {
      const totalProgress = progressData.reduce((sum, goal) => {
        return sum + (goal.current / goal.target);
      }, 0);
      averageCompletion = Math.round((totalProgress / progressData.length) * 100);
    }

    // Hämta team-bidrag (mål som användaren bidrar till men inte skapade/ansvarar för)
    const { data: teamContributions, error: contribError } = await supabase
      .from('goal_contributors')
      .select('id')
      .eq('user_id', userId);

    if (contribError) throw contribError;

    // Hämta senaste aktivitet
    const { data: latestActivity, error: activityError } = await supabase
      .from('goal_progress_logs')
      .select('created_at')
      .eq('changed_by', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Om det inte finns någon aktivitet är det okej, vi fortsätter ändå
    const lastActivity = latestActivity?.created_at;

    return {
      data: {
        userId,
        completedGoals: completedGoals?.length || 0,
        activeGoals: activeGoals?.length || 0,
        averageCompletion,
        teamContributions: teamContributions?.length || 0,
        lastActivity
      },
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte hämta användarstatistik');
  }
}

/**
 * Hämta teamstatistik för mål
 */
export async function getTeamGoalStats(teamId: string): Promise<ServiceResponse<TeamGoalStats>> {
  try {
    // Hämta antal avklarade team-mål
    const { data: completedGoals, error: completedError } = await supabase
      .from('goals')
      .select('id')
      .eq('team_id', teamId)
      .eq('scope', 'team')
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // Hämta antal aktiva team-mål
    const { data: activeGoals, error: activeError } = await supabase
      .from('goals')
      .select('id')
      .eq('team_id', teamId)
      .eq('scope', 'team')
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Hämta genomsnittlig progress för aktiva mål
    const { data: progressData, error: progressError } = await supabase
      .from('goals')
      .select('current, target')
      .eq('team_id', teamId)
      .eq('scope', 'team')
      .eq('status', 'active');

    if (progressError) throw progressError;

    // Beräkna genomsnittlig avklaringsgrad
    let averageCompletion = 0;
    if (progressData && progressData.length > 0) {
      const totalProgress = progressData.reduce((sum, goal) => {
        return sum + (goal.current / goal.target);
      }, 0);
      averageCompletion = Math.round((totalProgress / progressData.length) * 100);
    }

    // Hämta top bidragsgivare
    let topContributors = [];
    try {
      const { data: contributors, error: contribError } = await supabase
        .rpc('get_top_goal_contributors', { team_id: teamId, limit_num: 5 });

      if (!contribError && contributors) {
        topContributors = contributors;
      } else {
        console.log('Ingen top contributors data hittades:', contribError);
      }
    } catch (contribError) {
      console.error('Fel vid hämtning av top contributors:', contribError);
      // Vi fortsätter även om det blir fel här eftersom det är en bonus-funktion
    }

    // Hämta mest aktiva dag (requires a database function)
    let mostActiveDay = undefined;
    try {
      const { data: activeDay, error: dayError } = await supabase
        .rpc('get_most_active_goal_day', { team_id: teamId });

      if (!dayError && activeDay) {
        mostActiveDay = activeDay;
      }
    } catch (dayError) {
      console.error('Fel vid hämtning av mest aktiva dag:', dayError);
      // Vi fortsätter även här om det blir fel
    }

    return {
      data: {
        teamId,
        completedGoals: completedGoals?.length || 0,
        activeGoals: activeGoals?.length || 0,
        averageCompletion,
        topContributors,
        mostActiveDay
      },
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte hämta teamstatistik');
  }
}

/**
 * Skapa en relation mellan två mål
 */
export async function createGoalRelation(
  relation: Omit<GoalRelation, 'createdAt'>
): Promise<ServiceResponse<GoalRelation>> {
  try {
    // Anpassa fältnamnen till databasens format
    const newRelation = {
      source_goal_id: relation.sourceGoalId,
      target_goal_id: relation.targetGoalId,
      type: relation.type,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('goal_relations')
      .insert([newRelation])
      .select()
      .single();

    if (error) throw error;

    // Konvertera tillbaka till API:ets format
    const formattedRelation: GoalRelation = {
      sourceGoalId: data.source_goal_id,
      targetGoalId: data.target_goal_id,
      type: data.type,
      createdAt: data.created_at
    };

    return {
      data: formattedRelation,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte skapa relation mellan mål');
  }
}

/**
 * Ta bort en relation mellan två mål
 */
export async function deleteGoalRelation(
  sourceGoalId: string, 
  targetGoalId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('goal_relations')
      .delete()
      .eq('source_goal_id', sourceGoalId)
      .eq('target_goal_id', targetGoalId);

    if (error) throw error;

    return {
      data: true,
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte ta bort relation');
  }
}

/**
 * Hämta relaterade mål
 */
export async function getRelatedGoals(goalId: string): Promise<ServiceResponse<Goal[]>> {
  try {
    // Hämta både utgående och inkommande relationer
    const { data: relations, error } = await supabase
      .from('goal_relations')
      .select(`
        source_goal_id,
        target_goal_id,
        type
      `)
      .or(`source_goal_id.eq.${goalId},target_goal_id.eq.${goalId}`);

    if (error) throw error;

    if (!relations || relations.length === 0) {
      return {
        data: [],
        error: null,
        status: 'success'
      };
    }

    // Skapa en lista av alla relaterade mål-IDs
    const relatedGoalIds = relations.map(rel => 
      rel.source_goal_id === goalId ? rel.target_goal_id : rel.source_goal_id
    );

    // Hämta detaljer för dessa mål
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select(`
        *,
        milestones(*),
        goal_tag_relations(tag_id, goal_tags(*))
      `)
      .in('id', relatedGoalIds);

    if (goalsError) throw goalsError;

    // Transformera data för att matcha Goal-interfacet
    const formattedGoals = goals?.map(goal => ({
      ...goal,
      tags: goal.goal_tag_relations?.map(relation => relation.goal_tags) || []
    })) || [];

    return {
      data: formattedGoals as Goal[],
      error: null,
      status: 'success'
    };
  } catch (error) {
    return handleServiceError(error, 'Kunde inte hämta relaterade mål');
  }
}