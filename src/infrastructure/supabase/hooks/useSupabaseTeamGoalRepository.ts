import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '../types';
import { SupabaseTeamGoalRepository } from '../repositories/SupabaseTeamGoalRepository';
import { useDomainEventPublisher } from '@/domain/core/events/DomainEventPublisher';

let repository: SupabaseTeamGoalRepository | null = null;

export function useSupabaseTeamGoalRepository(): SupabaseTeamGoalRepository {
  const supabase = useSupabaseClient<Database>();
  const eventPublisher = useDomainEventPublisher();

  if (!repository) {
    repository = new SupabaseTeamGoalRepository(supabase, eventPublisher);
  }

  return repository;
} 