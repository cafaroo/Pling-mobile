import { SupabaseClient } from '@supabase/supabase-js';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Team, TeamProps } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamInvitation } from '@/domain/team/value-objects/TeamInvitation';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, err, ok } from '@/shared/core/Result';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { TeamSettings } from '@/domain/team/entities/TeamSettings';
import { EventBus } from '@/shared/core/EventBus';

// Supabase datamodeller
export interface TeamModel {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  settings: Record<string, any>;
}

export interface TeamMemberModel {
  team_id: string;
  user_id: string;
  role: string; // 'owner', 'admin', 'member'
  joined_at: string;
}

export interface TeamInvitationModel {
  id: string;
  team_id: string;
  user_id: string;
  invited_by: string;
  email: string | null;
  status: string; // 'pending', 'accepted', 'declined', 'expired'
  expires_at: string | null;
  created_at: string;
  responded_at: string | null;
}

export class SupabaseTeamRepository implements TeamRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly eventBus: EventBus
  ) {}

  // Privata hjälpmetoder för konvertering mellan domänmodell och datamodell
  private toTeamModel(team: Team): TeamModel {
    return {
      id: team.id.toString(),
      name: team.name,
      description: team.description || null,
      owner_id: team.ownerId.toString(),
      created_at: team.createdAt.toISOString(),
      updated_at: team.updatedAt.toISOString(),
      settings: team.settings.toJSON()
    };
  }

  private toTeamMemberModel(teamId: string, member: TeamMember): TeamMemberModel {
    return {
      team_id: teamId,
      user_id: member.userId.toString(),
      role: member.role,
      joined_at: member.joinedAt.toISOString()
    };
  }

  private toTeamInvitationModel(invitation: TeamInvitation): TeamInvitationModel {
    return {
      id: invitation.id.toString(),
      team_id: invitation.teamId.toString(),
      user_id: invitation.userId.toString(),
      invited_by: invitation.invitedBy.toString(),
      email: invitation.email || null,
      status: invitation.status,
      expires_at: invitation.expiresAt?.toISOString() || null,
      created_at: invitation.createdAt.toISOString(),
      responded_at: invitation.respondedAt?.toISOString() || null
    };
  }

  private async mapToTeam(teamData: TeamModel): Promise<Result<Team, string>> {
    try {
      // Hämta medlemmar
      const { data: memberData, error: memberError } = await this.supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamData.id);

      if (memberError) {
        return err(`Kunde inte hämta teammedlemmar: ${memberError.message}`);
      }

      // Hämta inbjudningar
      const { data: invitationData, error: invitationError } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamData.id)
        .eq('status', 'pending');

      if (invitationError) {
        return err(`Kunde inte hämta inbjudningar: ${invitationError.message}`);
      }

      // Konvertera medlemmar till domänobjekt
      const members = memberData.map(m => {
        const result = TeamMember.create({
          userId: new UniqueId(m.user_id),
          role: m.role as TeamRole,
          joinedAt: new Date(m.joined_at)
        });

        if (result.isErr()) {
          throw new Error(result.error);
        }

        return result.getValue();
      });

      // Konvertera inbjudningar till domänobjekt
      const invitations = invitationData.map(i => {
        const result = TeamInvitation.create({
          id: new UniqueId(i.id),
          teamId: new UniqueId(i.team_id),
          userId: new UniqueId(i.user_id),
          invitedBy: new UniqueId(i.invited_by),
          email: i.email || undefined,
          status: i.status as any,
          expiresAt: i.expires_at ? new Date(i.expires_at) : undefined,
          createdAt: new Date(i.created_at),
          respondedAt: i.responded_at ? new Date(i.responded_at) : undefined
        });

        if (result.isErr()) {
          throw new Error(result.error);
        }

        return result.getValue();
      });

      // Skapa TeamSettings
      const settingsResult = TeamSettings.create(teamData.settings);
      if (settingsResult.isErr()) {
        return err(`Kunde inte skapa teaminställningar: ${settingsResult.error}`);
      }

      // Skapa och återskapa team
      const teamProps: TeamProps = {
        id: new UniqueId(teamData.id),
        name: teamData.name,
        description: teamData.description || undefined,
        ownerId: new UniqueId(teamData.owner_id),
        members,
        invitations,
        settings: settingsResult.getValue(),
        createdAt: new Date(teamData.created_at),
        updatedAt: new Date(teamData.updated_at)
      };

      // Manuellt skapa team med de hämtade värdena
      // Vi måste använda en anpassad privat konstruktor eller reflexion
      // för att skapa team med befintligt ID
      const TeamClass = Team as any;
      const team = Reflect.construct(TeamClass, [teamProps]);

      return ok(team);
    } catch (error) {
      return err(`Kunde inte konvertera team: ${error.message}`);
    }
  }

  // Implementera TeamRepository interface
  async findById(id: UniqueId): Promise<Result<Team, string>> {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .select('*')
        .eq('id', id.toString())
        .single();

      if (error) {
        return err(`Kunde inte hitta team: ${error.message}`);
      }

      if (!data) {
        return err(`Team med ID ${id.toString()} hittades inte`);
      }

      return this.mapToTeam(data);
    } catch (error) {
      return err(`Fel vid hämtning av team: ${error.message}`);
    }
  }

  async findByUserId(userId: UniqueId): Promise<Result<Team[], string>> {
    try {
      // Hitta alla team där användaren är medlem
      const { data: memberData, error: memberError } = await this.supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId.toString());

      if (memberError) {
        return err(`Kunde inte hämta användarens team: ${memberError.message}`);
      }

      if (!memberData || memberData.length === 0) {
        return ok([]);
      }

      // Hämta alla team baserat på team_ids
      const teamIds = memberData.map(m => m.team_id);
      const { data: teamData, error: teamError } = await this.supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);

      if (teamError) {
        return err(`Kunde inte hämta teamdetaljer: ${teamError.message}`);
      }

      // Konvertera alla team till domänobjekt
      const teamPromises = teamData.map(team => this.mapToTeam(team));
      const teamResults = await Promise.all(teamPromises);

      // Filtrera bort eventuella felaktiga team
      const teams = teamResults
        .filter(result => result.isOk())
        .map(result => result.getValue());

      return ok(teams);
    } catch (error) {
      return err(`Fel vid hämtning av användarens team: ${error.message}`);
    }
  }

  async save(team: Team): Promise<Result<void, string>> {
    try {
      // Konvertera team till datamodell
      const teamModel = this.toTeamModel(team);

      // Starta en transaktion
      const { error: teamError } = await this.supabase
        .from('teams')
        .upsert(teamModel);

      if (teamError) {
        return err(`Kunde inte spara team: ${teamError.message}`);
      }

      // Uppdatera medlemmar (ta bort alla och lägg till igen)
      const { error: deleteError } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id.toString());

      if (deleteError) {
        return err(`Kunde inte uppdatera teammedlemmar: ${deleteError.message}`);
      }

      // Spara alla medlemmar
      const memberModels = team.members.map(member => 
        this.toTeamMemberModel(team.id.toString(), member)
      );

      if (memberModels.length > 0) {
        const { error: memberError } = await this.supabase
          .from('team_members')
          .upsert(memberModels);

        if (memberError) {
          return err(`Kunde inte spara teammedlemmar: ${memberError.message}`);
        }
      }

      // Uppdatera inbjudningar (ta bort alla och lägg till igen)
      const { error: inviteDeleteError } = await this.supabase
        .from('team_invitations')
        .delete()
        .eq('team_id', team.id.toString())
        .eq('status', 'pending');

      if (inviteDeleteError) {
        return err(`Kunde inte uppdatera inbjudningar: ${inviteDeleteError.message}`);
      }

      // Spara alla väntande inbjudningar
      const invitationModels = team.invitations.map(invitation => 
        this.toTeamInvitationModel(invitation)
      );

      if (invitationModels.length > 0) {
        const { error: inviteError } = await this.supabase
          .from('team_invitations')
          .upsert(invitationModels);

        if (inviteError) {
          return err(`Kunde inte spara inbjudningar: ${inviteError.message}`);
        }
      }

      // Publicera domänhändelser
      team.domainEvents.forEach(event => {
        this.eventBus.publish(event);
      });
      team.clearDomainEvents();

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid sparande av team: ${error.message}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('teams')
        .delete()
        .eq('id', id.toString());

      if (error) {
        return err(`Kunde inte ta bort team: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av team: ${error.message}`);
    }
  }

  async getMembers(teamId: UniqueId): Promise<Result<TeamMember[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId.toString());

      if (error) {
        return err(`Kunde inte hämta teammedlemmar: ${error.message}`);
      }

      // Konvertera till domänobjekt
      const members = data.map(m => {
        const result = TeamMember.create({
          userId: new UniqueId(m.user_id),
          role: m.role as TeamRole,
          joinedAt: new Date(m.joined_at)
        });

        if (result.isErr()) {
          throw new Error(result.error);
        }

        return result.getValue();
      });

      return ok(members);
    } catch (error) {
      return err(`Fel vid hämtning av teammedlemmar: ${error.message}`);
    }
  }

  async addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>> {
    try {
      const memberModel = this.toTeamMemberModel(teamId.toString(), member);

      const { error } = await this.supabase
        .from('team_members')
        .upsert(memberModel);

      if (error) {
        return err(`Kunde inte lägga till teammedlem: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid tillägg av teammedlem: ${error.message}`);
    }
  }

  async removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId.toString())
        .eq('user_id', userId.toString());

      if (error) {
        return err(`Kunde inte ta bort teammedlem: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av teammedlem: ${error.message}`);
    }
  }

  async updateMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, string>> {
    try {
      const memberModel = this.toTeamMemberModel(teamId.toString(), member);

      const { error } = await this.supabase
        .from('team_members')
        .update({
          role: memberModel.role
        })
        .eq('team_id', teamId.toString())
        .eq('user_id', member.userId.toString());

      if (error) {
        return err(`Kunde inte uppdatera teammedlem: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av teammedlem: ${error.message}`);
    }
  }

  async getInvitations(teamId: UniqueId): Promise<Result<TeamInvitation[], string>> {
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId.toString());

      if (error) {
        return err(`Kunde inte hämta inbjudningar: ${error.message}`);
      }

      // Konvertera till domänobjekt
      const invitations = data.map(i => {
        const result = TeamInvitation.create({
          id: new UniqueId(i.id),
          teamId: new UniqueId(i.team_id),
          userId: new UniqueId(i.user_id),
          invitedBy: new UniqueId(i.invited_by),
          email: i.email || undefined,
          status: i.status as any,
          expiresAt: i.expires_at ? new Date(i.expires_at) : undefined,
          createdAt: new Date(i.created_at),
          respondedAt: i.responded_at ? new Date(i.responded_at) : undefined
        });

        if (result.isErr()) {
          throw new Error(result.error);
        }

        return result.getValue();
      });

      return ok(invitations);
    } catch (error) {
      return err(`Fel vid hämtning av inbjudningar: ${error.message}`);
    }
  }

  async createInvitation(invitation: TeamInvitation): Promise<Result<void, string>> {
    try {
      const invitationModel = this.toTeamInvitationModel(invitation);

      const { error } = await this.supabase
        .from('team_invitations')
        .insert(invitationModel);

      if (error) {
        return err(`Kunde inte skapa inbjudan: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid skapande av inbjudan: ${error.message}`);
    }
  }

  async updateInvitation(invitation: TeamInvitation): Promise<Result<void, string>> {
    try {
      const invitationModel = this.toTeamInvitationModel(invitation);

      const { error } = await this.supabase
        .from('team_invitations')
        .update({
          status: invitationModel.status,
          responded_at: invitationModel.responded_at
        })
        .eq('id', invitation.id.toString());

      if (error) {
        return err(`Kunde inte uppdatera inbjudan: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid uppdatering av inbjudan: ${error.message}`);
    }
  }

  async deleteInvitation(id: UniqueId): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('team_invitations')
        .delete()
        .eq('id', id.toString());

      if (error) {
        return err(`Kunde inte ta bort inbjudan: ${error.message}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Fel vid borttagning av inbjudan: ${error.message}`);
    }
  }

  async search(query: string, limit: number = 10): Promise<Result<Team[], string>> {
    try {
      let queryBuilder = this.supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);

      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return err(`Kunde inte söka efter team: ${error.message}`);
      }

      // Konvertera till domänobjekt
      const teamPromises = data.map(team => this.mapToTeam(team));
      const teamResults = await Promise.all(teamPromises);

      // Filtrera bort eventuella felaktiga team
      const teams = teamResults
        .filter(result => result.isOk())
        .map(result => result.getValue());

      return ok(teams);
    } catch (error) {
      return err(`Fel vid sökning efter team: ${error.message}`);
    }
  }

  async isMember(teamId: UniqueId, userId: UniqueId): Promise<Result<boolean, string>> {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId.toString())
        .eq('user_id', userId.toString())
        .maybeSingle();

      if (error) {
        return err(`Kunde inte kontrollera medlemskap: ${error.message}`);
      }

      return ok(!!data);
    } catch (error) {
      return err(`Fel vid kontroll av medlemskap: ${error.message}`);
    }
  }
} 