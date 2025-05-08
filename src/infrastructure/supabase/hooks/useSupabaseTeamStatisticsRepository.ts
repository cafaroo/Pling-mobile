import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { SupabaseTeamStatisticsRepository } from '../repositories/SupabaseTeamStatisticsRepository';

export function useSupabaseTeamStatisticsRepository() {
  const supabase = useSupabaseClient();
  return new SupabaseTeamStatisticsRepository(supabase);
} 