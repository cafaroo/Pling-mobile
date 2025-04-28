import { supabase } from './supabaseClient';
import { Competition, CompetitionDetails, CompetitionCategory } from '@/types';

type CreateCompetitionData = {
  title: string;
  description: string;
  type: 'individual' | 'team';
  startDate: Date;
  endDate: Date;
  targetType: 'sales_amount' | 'sales_count';
  targetValue: number;
  prize?: string;
  teamId?: string;
};

export const createCompetition = async (data: CreateCompetitionData): Promise<Competition | null> => {
  try {
    // Map the frontend type values to match database constraints
    const competitionType = data.targetType;
    const participationType = data.type;

    const { data: competition, error } = await supabase
      .from('competitions')
      .insert({
        title: data.title,
        description: data.description,
        type: competitionType, // Use targetType for the type column (sales_amount or sales_count)
        participant_type: participationType, // Use type for participant_type (individual or team)
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        target_type: data.targetType,
        target_value: data.targetValue,
        prize: data.prize,
        team_id: data.teamId
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: competition.id,
      title: competition.title,
      description: competition.description,
      type: competition.type,
      startDate: competition.start_date,
      endDate: competition.end_date,
      targetValue: competition.target_value,
      currentValue: 0,
      currentPosition: 0,
      totalParticipants: 0,
      prize: competition.prize
    };
  } catch (error) {
    console.error('Error creating competition:', error);
    return null;
  }
};

// Get competition categories
const getCategories = async (): Promise<CompetitionCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('competition_categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
};

// Get competitions list
export const getCompetitions = async (
  categoryId?: string | null,
  filters?: {
    status?: string[];
    type?: string[];
    hasPrize?: boolean | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }
) => {
  try {
    let query = supabase
      .from('competitions')
      .select(`
        *,
        category:category_id (
          id,
          name,
          color,
          icon
        ),
        competition_participants (
          id,
          current_value,
          rank
        )
      `)
      .order('start_date', { ascending: true })
      .neq('status', 'ended');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      if (filters.type && filters.type.length > 0) {
        query = query.in('participant_type', filters.type);
      }
      
      if (filters.hasPrize !== null) {
        if (filters.hasPrize) {
          query = query.not('prize', 'is', null);
        } else {
          query = query.is('prize', null);
        }
      }
      
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate.toISOString());
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((competition: any) => ({
      id: competition.id,
      title: competition.title,
      description: competition.description,
      type: competition.type,
      startDate: competition.start_date,
      endDate: competition.end_date,
      targetValue: competition.target_value,
      currentValue: competition.competition_participants?.[0]?.current_value || 0,
      currentPosition: competition.competition_participants?.[0]?.rank || 0,
      totalParticipants: 0, // Will be updated with actual count
      prize: competition.prize,
      category: competition.category,
      status: competition.status,
      imageUrl: competition.image_url
    }));
  } catch (error) {
    console.error('Error getting competitions:', error);
    return [];
  }
};

// Get competition details
export const getCompetitionDetails = async (id: string): Promise<CompetitionDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('*, competition_participants(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Map database fields to frontend model
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.participant_type,
      startDate: data.start_date,
      endDate: data.end_date,
      targetValue: data.target_value,
      currentValue: data.competition_participants?.[0]?.current_value || 0,
      currentPosition: data.competition_participants?.[0]?.rank || 1,
      positionChange: 0, // TODO: Calculate from historical data
      totalParticipants: await getCompetitionParticipantCount(id),
      participantId: data.competition_participants?.[0]?.id
    };
  } catch (error) {
    console.error('Error getting competition details:', error);
    return null;
  }
};

// Helper function to get participant count
const getCompetitionParticipantCount = async (competitionId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('competition_participants')
      .select('*', { count: 'exact' })
      .eq('competition_id', competitionId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting participant count:', error);
    return 0;
  }
};