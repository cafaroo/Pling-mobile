import { SupabaseClient } from '@supabase/supabase-js';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamInvitation } from '@/domain/team/entities/TeamInvitation';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';
import { TeamMapper } from '../mappers/TeamMapper';
import { DatabaseError } from '@/shared/core/errors/DatabaseError';

export class SupabaseTeamRepository implements TeamRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: UniqueId): Promise<Team | null> {
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

    if (error) throw new DatabaseError(error.message);
    return data ? TeamMapper.toDomain(data) : null;
  }

  async findByOwnerId(ownerId: UniqueId): Promise<Team[]> {
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

    if (error) throw new DatabaseError(error.message);
    return data ? data.map(TeamMapper.toDomain) : [];
  }

  async findByMemberId(userId: UniqueId): Promise<Team[]> {
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

    if (error) throw new DatabaseError(error.message);
    return data ? data.map(TeamMapper.toDomain) : [];
  }

  async save(team: Team): Promise<void> {
    const { error: teamError } = await this.supabase
      .from('v2_teams')
      .upsert(TeamMapper.toPersistence(team));

    if (teamError) throw new DatabaseError(teamError.message);

    // Uppdatera medlemmar
    const { members } = TeamMapper.toPersistence(team);
    const { error: membersError } = await this.supabase
      .from('v2_team_members')
      .upsert(members);

    if (membersError) throw new DatabaseError(membersError.message);
  }

  async delete(id: UniqueId): Promise<void> {
    const { error } = await this.supabase
      .from('v2_teams')
      .delete()
      .eq('id', id);

    if (error) throw new DatabaseError(error.message);
  }

  async addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, Error>> {
    const { error } = await this.supabase
      .from('v2_team_members')
      .insert({
        team_id: teamId,
        user_id: member.userId,
        role: member.role
      });

    if (error) return err(new DatabaseError(error.message));
    return ok(undefined);
  }

  async updateMemberRole(
    teamId: UniqueId,
    userId: UniqueId,
    role: string
  ): Promise<Result<void, Error>> {
    const { error } = await this.supabase
      .from('v2_team_members')
      .update({ role })
      .match({ team_id: teamId, user_id: userId });

    if (error) return err(new DatabaseError(error.message));
    return ok(undefined);
  }

  async removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, Error>> {
    const { error } = await this.supabase
      .from('v2_team_members')
      .delete()
      .match({ team_id: teamId, user_id: userId });

    if (error) return err(new DatabaseError(error.message));
    return ok(undefined);
  }

  async createInvitation(invitation: TeamInvitation): Promise<Result<void, Error>> {
    const { error } = await this.supabase
      .from('v2_team_invitations')
      .insert(TeamMapper.invitationToPersistence(invitation));

    if (error) return err(new DatabaseError(error.message));
    return ok(undefined);
  }

  async findInvitationById(id: UniqueId): Promise<TeamInvitation | null> {
    const { data, error } = await this.supabase
      .from('v2_team_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new DatabaseError(error.message);
    return data ? TeamMapper.invitationToDomain(data) : null;
  }

  async findInvitationsByTeamId(teamId: UniqueId): Promise<TeamInvitation[]> {
    const { data, error } = await this.supabase
      .from('v2_team_invitations')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw new DatabaseError(error.message);
    return data ? data.map(TeamMapper.invitationToDomain) : [];
  }

  async acceptInvitation(id: UniqueId): Promise<Result<void, Error>> {
    const { error } = await this.supabase
      .from('v2_team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return err(new DatabaseError(error.message));
    return ok(undefined);
  }

  async deleteInvitation(id: UniqueId): Promise<void> {
    const { error } = await this.supabase
      .from('v2_team_invitations')
      .delete()
      .eq('id', id);

    if (error) throw new DatabaseError(error.message);
  }
} 