import { SupabaseClient } from '@supabase/supabase-js';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamInvitation } from '@/domain/team/entities/TeamInvitation';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { TeamMapper } from '../mappers/TeamMapper';
import { DatabaseError } from '@/shared/core/errors/DatabaseError';
import { EventBus } from '@/infrastructure/events/EventBus';

export class SupabaseTeamRepository implements TeamRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus?: EventBus
  ) {}

  async findById(id: UniqueId): Promise<Result<Team, string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_teams')
        .select(`
          *,
          members:v2_team_members(
            user_id,
            role,
            joined_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) return err(error.message);
      return data ? ok(TeamMapper.toDomain(data)) : err(`Team med ID ${id.toString()} hittades inte`);
    } catch (error) {
      return err(`Fel vid hämtning av team: ${error.message}`);
    }
  }

  async findByUserId(userId: UniqueId): Promise<Result<Team[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_teams')
        .select(`
          *,
          members:v2_team_members(
            user_id,
            role,
            joined_at
          )
        `)
        .eq('v2_team_members.user_id', userId);

      if (error) return err(error.message);
      return ok(data ? data.map(TeamMapper.toDomain) : []);
    } catch (error) {
      return err(`Fel vid hämtning av användarens team: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId: UniqueId): Promise<Result<Team[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_teams')
        .select(`
          *,
          members:v2_team_members(
            user_id,
            role,
            joined_at
          )
        `)
        .eq('owner_id', ownerId);

      if (error) return err(error.message);
      return ok(data ? data.map(TeamMapper.toDomain) : []);
    } catch (error) {
      return err(`Fel vid hämtning av ägarens team: ${error.message}`);
    }
  }

  async save(team: Team): Promise<Result<void, string>> {
    try {
      const { error: teamError } = await this.supabase
        .from('v2_teams')
        .upsert(TeamMapper.toPersistence(team));

      if (teamError) return err(teamError.message);

      // Uppdatera medlemmar
      const { members } = TeamMapper.toPersistence(team);
      const { error: membersError } = await this.supabase
        .from('v2_team_members')
        .upsert(members);

      if (membersError) return err(membersError.message);
      
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av team: ${error.message}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_teams')
        .delete()
        .eq('id', id);

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av team: ${error.message}`);
    }
  }

  async getMembers(teamId: UniqueId): Promise<Result<TeamMember[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_team_members')
        .select('*')
        .eq('team_id', teamId);

      if (error) return err(error.message);
      return ok(data ? data.map(TeamMapper.memberToDomain) : []);
    } catch (error) {
      return err(`Fel vid hämtning av teammedlemmar: ${error.message}`);
    }
  }

  async addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_members')
        .insert({
          team_id: teamId,
          user_id: member.userId,
          role: member.role
        });

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid tillägg av teammedlem: ${error.message}`);
    }
  }

  async updateMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_members')
        .update({ role: member.role })
        .match({ team_id: teamId, user_id: member.userId });

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av teammedlem: ${error.message}`);
    }
  }

  async removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_members')
        .delete()
        .match({ team_id: teamId, user_id: userId });

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av teammedlem: ${error.message}`);
    }
  }

  async getInvitations(teamId: UniqueId): Promise<Result<TeamInvitation[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_team_invitations')
        .select('*')
        .eq('team_id', teamId);

      if (error) return err(error.message);
      return ok(data ? data.map(TeamMapper.invitationToDomain) : []);
    } catch (error) {
      return err(`Fel vid hämtning av inbjudningar: ${error.message}`);
    }
  }

  async createInvitation(invitation: TeamInvitation): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_invitations')
        .insert(TeamMapper.invitationToPersistence(invitation));

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid skapande av inbjudan: ${error.message}`);
    }
  }

  async updateInvitation(invitation: TeamInvitation): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_invitations')
        .update(TeamMapper.invitationToPersistence(invitation))
        .eq('id', invitation.id);

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av inbjudan: ${error.message}`);
    }
  }

  async deleteInvitation(id: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_invitations')
        .delete()
        .eq('id', id);

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av inbjudan: ${error.message}`);
    }
  }

  async search(query: string, limit: number = 10): Promise<Result<Team[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_teams')
        .select(`
          *,
          members:v2_team_members(
            user_id,
            role,
            joined_at
          )
        `)
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (error) return err(error.message);
      return ok(data ? data.map(TeamMapper.toDomain) : []);
    } catch (error) {
      return err(`Fel vid sökning av team: ${error.message}`);
    }
  }

  async isMember(teamId: UniqueId, userId: UniqueId): Promise<Result<boolean, string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_team_members')
        .select('*')
        .match({ team_id: teamId, user_id: userId })
        .single();

      if (error && error.code !== 'PGRST116') {
        return err(error.message);
      }
      
      return ok(!!data);
    } catch (error) {
      return err(`Fel vid kontroll av medlemskap: ${error.message}`);
    }
  }
} 