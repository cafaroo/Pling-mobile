import { SupabaseClient } from '@supabase/supabase-js';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamInvitation } from '@/domain/team/value-objects/TeamInvitation';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMapper } from '../mappers/TeamMapper';
import { DatabaseError } from '@/shared/core/errors/DatabaseError';
import { EventBus } from '@/infrastructure/events/EventBus';

/**
 * SupabaseTeamRepository
 * 
 * Implementation av TeamRepository med Supabase som datakälla.
 * Följer DDD-principer genom att använda domänobjekt och Result-typen.
 */
export class SupabaseTeamRepository implements TeamRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus?: EventBus
  ) {}

  async findById(id: UniqueId): Promise<Result<Team | null, string>> {
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
        .eq('id', id.toString())
        .single();

      if (error) return err(error.message);
      
      if (!data) {
        return ok(null); // Team hittades inte
      }
      
      const teamResult = TeamMapper.toDomain(data);
      if (teamResult.isErr()) {
        return err(`Kunde inte mappa team från databasen: ${teamResult.error}`);
      }
      
      return ok(teamResult.value);
    } catch (error) {
      return err(`Fel vid hämtning av team: ${error instanceof Error ? error.message : String(error)}`);
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
        .eq('v2_team_members.user_id', userId.toString());

      if (error) return err(error.message);
      
      if (!data || data.length === 0) {
        return ok([]); // Inga team hittades
      }
      
      const teams: Team[] = [];
      for (const dto of data) {
        const teamResult = TeamMapper.toDomain(dto);
        if (teamResult.isErr()) {
          console.warn(`Kunde inte mappa team: ${teamResult.error}`);
          continue; // Fortsätt med nästa team
        }
        teams.push(teamResult.value);
      }
      
      return ok(teams);
    } catch (error) {
      return err(`Fel vid hämtning av användarens team: ${error instanceof Error ? error.message : String(error)}`);
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
        .eq('owner_id', ownerId.toString());

      if (error) return err(error.message);
      
      if (!data || data.length === 0) {
        return ok([]); // Inga team hittades
      }
      
      const teams: Team[] = [];
      for (const dto of data) {
        const teamResult = TeamMapper.toDomain(dto);
        if (teamResult.isErr()) {
          console.warn(`Kunde inte mappa team: ${teamResult.error}`);
          continue; // Fortsätt med nästa team
        }
        teams.push(teamResult.value);
      }
      
      return ok(teams);
    } catch (error) {
      return err(`Fel vid hämtning av ägarens team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async save(team: Team): Promise<Result<void, string>> {
    try {
      const teamData = TeamMapper.toPersistence(team);
      
      // Transaktionshantering sköts på databasnivå
      const { error: teamError } = await this.supabase
        .from('v2_teams')
        .upsert({
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          owner_id: teamData.owner_id,
          created_at: teamData.created_at,
          updated_at: teamData.updated_at
        });

      if (teamError) return err(teamError.message);

      // Uppdatera medlemmar (detta är en förenkling - i en riktig implementation
      // skulle vi behöva göra mer robust synkronisering)
      if (teamData.members && teamData.members.length > 0) {
        const { error: membersError } = await this.supabase
          .from('v2_team_members')
          .upsert(teamData.members);

        if (membersError) return err(membersError.message);
      }
      
      // Publicera domänevents om EventBus finns
      if (this.eventBus) {
        team.getDomainEvents().forEach(event => {
          this.eventBus?.publish(event);
        });
        
        // Rensa domänevents efter publicering
        team.clearEvents();
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      // Cascade-delete hanteras på databasnivå
      const { error } = await this.supabase
        .from('v2_teams')
        .delete()
        .eq('id', id.toString());

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getMembers(teamId: UniqueId): Promise<Result<TeamMember[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_team_members')
        .select('*')
        .eq('team_id', teamId.toString());

      if (error) return err(error.message);
      
      if (!data || data.length === 0) {
        return ok([]); // Inga medlemmar hittades
      }
      
      const members: TeamMember[] = [];
      for (const dto of data) {
        const memberResult = TeamMapper.memberToDomain(dto);
        if (memberResult.isErr()) {
          console.warn(`Kunde inte mappa teammedlem: ${memberResult.error}`);
          continue; // Fortsätt med nästa medlem
        }
        members.push(memberResult.value);
      }
      
      return ok(members);
    } catch (error) {
      return err(`Fel vid hämtning av teammedlemmar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>> {
    try {
      const memberData = TeamMapper.memberToPersistence(member, teamId);
      
      const { error } = await this.supabase
        .from('v2_team_members')
        .insert(memberData);

      if (error) {
        if (error.code === '23505') { // Unique violation
          return err('Användaren är redan medlem i teamet');
        }
        return err(error.message);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid tillägg av teammedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_members')
        .update({ role: member.role })
        .match({ 
          team_id: teamId.toString(), 
          user_id: member.userId.toString() 
        });

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av teammedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateMemberRole(teamId: UniqueId, userId: UniqueId, role: TeamRole): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_members')
        .update({ role })
        .match({ 
          team_id: teamId.toString(), 
          user_id: userId.toString() 
        });

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av teammedlemsroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_members')
        .delete()
        .match({ 
          team_id: teamId.toString(), 
          user_id: userId.toString() 
        });

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av teammedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getInvitations(teamId: UniqueId): Promise<Result<TeamInvitation[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_team_invitations')
        .select('*')
        .eq('team_id', teamId.toString());

      if (error) return err(error.message);
      
      if (!data || data.length === 0) {
        return ok([]); // Inga inbjudningar hittades
      }
      
      const invitations: TeamInvitation[] = [];
      for (const dto of data) {
        const invitationResult = TeamMapper.invitationToDomain(dto);
        if (invitationResult.isErr()) {
          console.warn(`Kunde inte mappa teaminbjudan: ${invitationResult.error}`);
          continue; // Fortsätt med nästa inbjudan
        }
        invitations.push(invitationResult.value);
      }
      
      return ok(invitations);
    } catch (error) {
      return err(`Fel vid hämtning av inbjudningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createInvitation(invitation: TeamInvitation): Promise<Result<void, string>> {
    try {
      const invitationData = TeamMapper.invitationToPersistence(invitation);
      
      const { error } = await this.supabase
        .from('v2_team_invitations')
        .insert(invitationData);

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid skapande av inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateInvitation(invitation: TeamInvitation): Promise<Result<void, string>> {
    try {
      const invitationData = TeamMapper.invitationToPersistence(invitation);
      
      const { error } = await this.supabase
        .from('v2_team_invitations')
        .update(invitationData)
        .eq('id', invitation.id.toString());

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteInvitation(id: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_team_invitations')
        .delete()
        .eq('id', id.toString());

      if (error) return err(error.message);
      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av inbjudan: ${error instanceof Error ? error.message : String(error)}`);
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
      
      if (!data || data.length === 0) {
        return ok([]); // Inga team hittades
      }
      
      const teams: Team[] = [];
      for (const dto of data) {
        const teamResult = TeamMapper.toDomain(dto);
        if (teamResult.isErr()) {
          console.warn(`Kunde inte mappa team: ${teamResult.error}`);
          continue; // Fortsätt med nästa team
        }
        teams.push(teamResult.value);
      }
      
      return ok(teams);
    } catch (error) {
      return err(`Fel vid sökning av team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isMember(teamId: UniqueId, userId: UniqueId): Promise<Result<boolean, string>> {
    try {
      const { data, error, count } = await this.supabase
        .from('v2_team_members')
        .select('*', { count: 'exact', head: true })
        .match({ 
          team_id: teamId.toString(), 
          user_id: userId.toString() 
        });

      if (error) return err(error.message);
      return ok(count !== null && count > 0);
    } catch (error) {
      return err(`Fel vid kontroll av medlemskap: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 