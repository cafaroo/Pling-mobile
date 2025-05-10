import { SupabaseClient } from '@supabase/supabase-js';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamActivity, TeamActivityProps } from '@/domain/team/entities/TeamActivity';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivityRepository, ActivityFilterOptions } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { supabase } from '../supabaseClient';

interface TeamActivityDTO {
  id: string;
  team_id: string;
  performed_by: string;
  performer_name?: string;
  activity_type: string;
  target_id?: string;
  target_name?: string;
  metadata: Record<string, any>;
  timestamp: string;
  total_count?: number;
}

interface ActivitySearchResult {
  activities: TeamActivity[];
  total: number;
  hasMore: boolean;
}

interface ActivityStatDTO {
  activity_type: string;
  activity_count: number;
}

/**
 * Supabase-implementation av TeamActivityRepository
 */
export class SupabaseTeamActivityRepository implements TeamActivityRepository {
  constructor(private readonly supabaseClient: SupabaseClient) {}

  /**
   * Konvertera TeamActivity-entitet till DTO för databaslagring
   */
  private toDTO(activity: TeamActivity): TeamActivityDTO {
    return {
      id: activity.id.toString(),
      team_id: activity.teamId.toString(),
      performed_by: activity.performedBy.toString(),
      activity_type: activity.activityType,
      target_id: activity.targetId?.toString(),
      metadata: activity.metadata,
      timestamp: activity.timestamp.toISOString(),
    };
  }

  /**
   * Konvertera DTO från databasen till TeamActivity-entitet
   */
  private toDomain(dto: TeamActivityDTO): Result<TeamActivity, string> {
    try {
      const props: TeamActivityProps = {
        teamId: new UniqueId(dto.team_id),
        performedBy: new UniqueId(dto.performed_by),
        activityType: dto.activity_type as ActivityType,
        targetId: dto.target_id ? new UniqueId(dto.target_id) : undefined,
        metadata: dto.metadata || {},
        timestamp: new Date(dto.timestamp),
      };

      // Lägg till performer_name och target_name i metadata om de finns
      if (dto.performer_name) {
        props.metadata.performer_name = dto.performer_name;
      }
      
      if (dto.target_name) {
        props.metadata.target_name = dto.target_name;
      }

      return TeamActivity.create({
        ...props,
        timestamp: new Date(dto.timestamp)
      }).map(activity => {
        // Returnera en ny instans med det lagrade ID:t
        return new TeamActivity(activity.props, new UniqueId(dto.id));
      });
    } catch (error) {
      return err(`Fel vid konvertering av TeamActivity DTO: ${error}`);
    }
  }

  /**
   * Spara en ny aktivitet
   */
  async save(activity: TeamActivity): Promise<Result<void, string>> {
    try {
      const dto = this.toDTO(activity);
      
      const { error } = await this.supabaseClient
        .from('team_activities')
        .upsert(dto);
      
      if (error) {
        return err(`Kunde inte spara teamaktivitet: ${error.message}`);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av teamaktivitet: ${error}`);
    }
  }

  /**
   * Hitta en aktivitet med ID
   */
  async findById(id: UniqueId): Promise<Result<TeamActivity, string>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('team_activities')
        .select('*')
        .eq('id', id.toString())
        .single();
      
      if (error) {
        return err(`Kunde inte hitta teamaktivitet: ${error.message}`);
      }
      
      if (!data) {
        return err(`Ingen teamaktivitet hittades med ID: ${id.toString()}`);
      }
      
      return this.toDomain(data as TeamActivityDTO);
    } catch (error) {
      return err(`Fel vid hämtning av teamaktivitet: ${error}`);
    }
  }

  /**
   * Hitta aktiviteter för ett specifikt team med optimerad databasfunktion
   */
  async findByTeamId(
    teamId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'teamId'>
  ): Promise<Result<ActivitySearchResult, string>> {
    try {
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      
      // Använd den optimerade RPC-funktionen
      const { data, error } = await this.supabaseClient.rpc(
        'get_paginated_team_activities', 
        {
          p_team_id: teamId.toString(),
          p_limit: limit,
          p_offset: offset,
          p_activity_types: options?.activityTypes,
          p_user_id: options?.performedBy?.toString(),
          p_start_date: options?.startDate?.toISOString(),
          p_end_date: options?.endDate?.toISOString(),
          p_user_is_target: options?.userIsTarget || false
        }
      );
      
      if (error) {
        return err(`Kunde inte hämta teamaktiviteter: ${error.message}`);
      }
      
      const activities: TeamActivity[] = [];
      let totalCount = 0;
      
      if (data && data.length > 0) {
        totalCount = data[0].total_count;
        
        for (const dto of data as TeamActivityDTO[]) {
          const activityResult = this.toDomain(dto);
          if (activityResult.isOk()) {
            activities.push(activityResult.value);
          }
        }
      }
      
      return ok({
        activities,
        total: totalCount,
        hasMore: offset + limit < totalCount
      });
    } catch (error) {
      return err(`Fel vid hämtning av teamaktiviteter: ${error}`);
    }
  }

  /**
   * Hitta aktiviteter utförda av en specifik användare
   */
  async findByPerformedBy(
    userId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'performedBy'>
  ): Promise<Result<ActivitySearchResult, string>> {
    try {
      // Använd get_paginated_team_activities med userId som filter
      const teamId = options?.teamId;
      if (!teamId) {
        return err('teamId krävs för att söka efter aktiviteter utförda av en användare');
      }
      
      return this.findByTeamId(teamId, {
        ...options,
        performedBy: userId
      });
    } catch (error) {
      return err(`Fel vid hämtning av användaraktiviteter: ${error}`);
    }
  }

  /**
   * Hitta aktiviteter där en användare är målperson
   */
  async findByTargetId(
    targetId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'targetId'>
  ): Promise<Result<ActivitySearchResult, string>> {
    try {
      // Använd get_paginated_team_activities med userIsTarget-flaggan
      const teamId = options?.teamId;
      if (!teamId) {
        return err('teamId krävs för att söka efter aktiviteter med en målperson');
      }
      
      return this.findByTeamId(teamId, {
        ...options,
        userIsTarget: true,
        performedBy: targetId // Använd performedBy som användar-ID för målet
      });
    } catch (error) {
      return err(`Fel vid hämtning av målaktiviteter: ${error}`);
    }
  }

  /**
   * Sök efter aktiviteter med flera filtreringskriterier
   */
  async search(options: ActivityFilterOptions): Promise<Result<ActivitySearchResult, string>> {
    try {
      if (!options.teamId) {
        return err('teamId krävs för aktivitetssökning');
      }
      
      return this.findByTeamId(options.teamId, options);
    } catch (error) {
      return err(`Fel vid sökning av aktiviteter: ${error}`);
    }
  }

  /**
   * Hämta de senaste aktiviteterna för ett team
   */
  async getLatestForTeam(
    teamId: UniqueId,
    limit: number
  ): Promise<Result<TeamActivity[], string>> {
    try {
      // Använd den optimerade RPC-funktionen för senaste aktiviteter
      const { data, error } = await this.supabaseClient.rpc(
        'get_latest_team_activities', 
        {
          p_team_id: teamId.toString(),
          p_limit: limit
        }
      );
      
      if (error) {
        return err(`Kunde inte hämta senaste teamaktiviteter: ${error.message}`);
      }
      
      const activities: TeamActivity[] = [];
      
      for (const dto of data as TeamActivityDTO[]) {
        const activityResult = this.toDomain(dto);
        if (activityResult.isOk()) {
          activities.push(activityResult.value);
        }
      }
      
      return ok(activities);
    } catch (error) {
      return err(`Fel vid hämtning av senaste teamaktiviteter: ${error}`);
    }
  }

  /**
   * Ta bort en aktivitet
   */
  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabaseClient
        .from('team_activities')
        .delete()
        .eq('id', id.toString());
      
      if (error) {
        return err(`Kunde inte ta bort teamaktivitet: ${error.message}`);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av teamaktivitet: ${error}`);
    }
  }

  /**
   * Räkna antalet aktiviteter som matchar sökfiltren
   */
  async count(options: ActivityFilterOptions): Promise<Result<number, string>> {
    try {
      if (!options.teamId) {
        return err('teamId krävs för att räkna aktiviteter');
      }
      
      // Använd den optimerade RPC-funktionen för paginerade resultat med limit=1
      // för att få reda på totalCount effektivt
      const result = await this.findByTeamId(options.teamId, {
        ...options,
        limit: 1,
        offset: 0
      });
      
      if (result.isErr()) {
        return err(result.error);
      }
      
      return ok(result.value.total);
    } catch (error) {
      return err(`Fel vid räkning av aktiviteter: ${error}`);
    }
  }

  /**
   * Hämta aktiviteter grupperade efter typ
   */
  async getGroupedByType(
    teamId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'teamId'>
  ): Promise<Result<Record<ActivityType, number>, string>> {
    try {
      // Använd den optimerade RPC-funktionen för aktivitetsstatistik
      const { data, error } = await this.supabaseClient.rpc(
        'get_team_activity_stats', 
        {
          p_team_id: teamId.toString(),
          p_start_date: options?.startDate?.toISOString(),
          p_end_date: options?.endDate?.toISOString()
        }
      );
      
      if (error) {
        return err(`Kunde inte hämta aktivitetsstatistik: ${error.message}`);
      }
      
      const groupedData: Record<ActivityType, number> = {} as Record<ActivityType, number>;
      
      for (const stat of data as ActivityStatDTO[]) {
        groupedData[stat.activity_type as ActivityType] = stat.activity_count;
      }
      
      return ok(groupedData);
    } catch (error) {
      return err(`Fel vid hämtning av grupperad aktivitetsstatistik: ${error}`);
    }
  }

  /**
   * Hämta teamstatistik baserad på aktiviteter
   */
  async getStatistics(
    teamId: UniqueId,
    period: StatisticsPeriod = StatisticsPeriod.WEEKLY
  ): Promise<Result<TeamStatistics, string>> {
    try {
      const now = new Date();
      const startDate = this.getStartDateForPeriod(now, period);
      
      const { data, error } = await supabase.rpc('get_team_statistics', {
        p_team_id: teamId.toString(),
        p_start_date: startDate.toISOString(),
        p_end_date: now.toISOString()
      });

      if (error) throw new Error(error.message);

      return TeamStatistics.calculateFromDailyStats(teamId, data, period);
    } catch (error) {
      return Result.err(`Kunde inte hämta teamstatistik: ${error.message}`);
    }
  }

  /**
   * Beräkna startdatum baserat på vald period
   */
  private getStartDateForPeriod(now: Date, period: StatisticsPeriod): Date {
    const startDate = new Date(now);
    
    switch (period) {
      case StatisticsPeriod.DAILY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case StatisticsPeriod.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case StatisticsPeriod.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case StatisticsPeriod.YEARLY:
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return startDate;
  }
} 