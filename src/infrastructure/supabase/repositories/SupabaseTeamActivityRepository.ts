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
  activity_type: string;
  target_id?: string;
  metadata: Record<string, any>;
  timestamp: string;
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
   * Hitta aktiviteter för ett specifikt team
   */
  async findByTeamId(
    teamId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'teamId'>
  ): Promise<Result<TeamActivity[], string>> {
    try {
      let query = this.supabaseClient
        .from('team_activities')
        .select('*')
        .eq('team_id', teamId.toString())
        .order('timestamp', { ascending: false });
      
      // Applicera filter baserat på options
      if (options) {
        if (options.performedBy) {
          query = query.eq('performed_by', options.performedBy.toString());
        }
        
        if (options.targetId) {
          query = query.eq('target_id', options.targetId.toString());
        }
        
        if (options.activityTypes && options.activityTypes.length > 0) {
          query = query.in('activity_type', options.activityTypes);
        }
        
        if (options.startDate) {
          query = query.gte('timestamp', options.startDate.toISOString());
        }
        
        if (options.endDate) {
          query = query.lte('timestamp', options.endDate.toISOString());
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        return err(`Kunde inte hämta teamaktiviteter: ${error.message}`);
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
      return err(`Fel vid hämtning av teamaktiviteter: ${error}`);
    }
  }

  /**
   * Hitta aktiviteter utförda av en specifik användare
   */
  async findByPerformedBy(
    userId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'performedBy'>
  ): Promise<Result<TeamActivity[], string>> {
    try {
      let query = this.supabaseClient
        .from('team_activities')
        .select('*')
        .eq('performed_by', userId.toString())
        .order('timestamp', { ascending: false });
      
      // Applicera filter baserat på options
      if (options) {
        if (options.teamId) {
          query = query.eq('team_id', options.teamId.toString());
        }
        
        if (options.targetId) {
          query = query.eq('target_id', options.targetId.toString());
        }
        
        if (options.activityTypes && options.activityTypes.length > 0) {
          query = query.in('activity_type', options.activityTypes);
        }
        
        if (options.startDate) {
          query = query.gte('timestamp', options.startDate.toISOString());
        }
        
        if (options.endDate) {
          query = query.lte('timestamp', options.endDate.toISOString());
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        return err(`Kunde inte hämta teamaktiviteter: ${error.message}`);
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
      return err(`Fel vid hämtning av teamaktiviteter: ${error}`);
    }
  }

  /**
   * Hitta aktiviteter som har en specifik användare som mål
   */
  async findByTargetId(
    targetId: UniqueId,
    options?: Omit<ActivityFilterOptions, 'targetId'>
  ): Promise<Result<TeamActivity[], string>> {
    try {
      let query = this.supabaseClient
        .from('team_activities')
        .select('*')
        .eq('target_id', targetId.toString())
        .order('timestamp', { ascending: false });
      
      // Applicera filter baserat på options
      if (options) {
        if (options.teamId) {
          query = query.eq('team_id', options.teamId.toString());
        }
        
        if (options.performedBy) {
          query = query.eq('performed_by', options.performedBy.toString());
        }
        
        if (options.activityTypes && options.activityTypes.length > 0) {
          query = query.in('activity_type', options.activityTypes);
        }
        
        if (options.startDate) {
          query = query.gte('timestamp', options.startDate.toISOString());
        }
        
        if (options.endDate) {
          query = query.lte('timestamp', options.endDate.toISOString());
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        return err(`Kunde inte hämta teamaktiviteter: ${error.message}`);
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
      return err(`Fel vid hämtning av teamaktiviteter: ${error}`);
    }
  }

  /**
   * Söka aktiviteter med filter
   */
  async search(options: ActivityFilterOptions): Promise<Result<TeamActivity[], string>> {
    try {
      let query = this.supabaseClient
        .from('team_activities')
        .select('*')
        .order('timestamp', { ascending: false });
      
      // Applicera alla filter från options
      if (options.teamId) {
        query = query.eq('team_id', options.teamId.toString());
      }
      
      if (options.performedBy) {
        query = query.eq('performed_by', options.performedBy.toString());
      }
      
      if (options.targetId) {
        query = query.eq('target_id', options.targetId.toString());
      }
      
      if (options.activityTypes && options.activityTypes.length > 0) {
        query = query.in('activity_type', options.activityTypes);
      }
      
      if (options.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }
      
      if (options.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return err(`Kunde inte söka teamaktiviteter: ${error.message}`);
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
      return err(`Fel vid sökning av teamaktiviteter: ${error}`);
    }
  }

  /**
   * Hämta de senaste aktiviteterna i ett team
   */
  async getLatestForTeam(
    teamId: UniqueId,
    limit: number
  ): Promise<Result<TeamActivity[], string>> {
    try {
      const { data, error } = await this.supabaseClient
        .from('team_activities')
        .select('*')
        .eq('team_id', teamId.toString())
        .order('timestamp', { ascending: false })
        .limit(limit);
      
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
   * Räkna aktiviteter som matchar filter
   */
  async count(options: ActivityFilterOptions): Promise<Result<number, string>> {
    try {
      let query = this.supabaseClient
        .from('team_activities')
        .select('*', { count: 'exact', head: true });
      
      // Applicera alla filter från options
      if (options.teamId) {
        query = query.eq('team_id', options.teamId.toString());
      }
      
      if (options.performedBy) {
        query = query.eq('performed_by', options.performedBy.toString());
      }
      
      if (options.targetId) {
        query = query.eq('target_id', options.targetId.toString());
      }
      
      if (options.activityTypes && options.activityTypes.length > 0) {
        query = query.in('activity_type', options.activityTypes);
      }
      
      if (options.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }
      
      if (options.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }
      
      const { count, error } = await query;
      
      if (error) {
        return err(`Kunde inte räkna teamaktiviteter: ${error.message}`);
      }
      
      return ok(count || 0);
    } catch (error) {
      return err(`Fel vid räkning av teamaktiviteter: ${error}`);
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
      let query = this.supabaseClient
        .from('team_activities')
        .select('activity_type, count')
        .eq('team_id', teamId.toString())
        .group('activity_type');
      
      // Applicera filter baserat på options
      if (options) {
        if (options.performedBy) {
          query = query.eq('performed_by', options.performedBy.toString());
        }
        
        if (options.targetId) {
          query = query.eq('target_id', options.targetId.toString());
        }
        
        if (options.activityTypes && options.activityTypes.length > 0) {
          query = query.in('activity_type', options.activityTypes);
        }
        
        if (options.startDate) {
          query = query.gte('timestamp', options.startDate.toISOString());
        }
        
        if (options.endDate) {
          query = query.lte('timestamp', options.endDate.toISOString());
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        return err(`Kunde inte hämta grupperade teamaktiviteter: ${error.message}`);
      }
      
      const result: Record<ActivityType, number> = {} as Record<ActivityType, number>;
      
      // Initiera alla aktivitetstyper med 0
      Object.values(ActivityType).forEach(type => {
        result[type as ActivityType] = 0;
      });
      
      // Fyll i faktiska värden
      for (const item of data) {
        result[item.activity_type as ActivityType] = item.count;
      }
      
      return ok(result);
    } catch (error) {
      return err(`Fel vid hämtning av grupperade teamaktiviteter: ${error}`);
    }
  }

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