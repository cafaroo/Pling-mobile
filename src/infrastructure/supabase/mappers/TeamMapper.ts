import { Team, TeamCreateDTO } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamInvitation } from '@/domain/team/value-objects/TeamInvitation';
import { TeamRole } from '@/domain/team/value-objects/TeamRole'; 
import { TeamSettings } from '@/domain/team/entities/TeamSettings';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * DTO från Supabase-databasen
 */
export interface TeamDTO {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  members?: TeamMemberDTO[];
  settings?: Record<string, any>;
}

export interface TeamMemberDTO {
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface TeamInvitationDTO {
  id: string;
  team_id: string;
  user_id?: string;
  invited_by: string;
  email?: string;
  status: string;
  created_at: string;
  expires_at?: string;
  responded_at?: string;
}

/**
 * TeamMapper
 * 
 * Ansvarar för konvertering mellan domänobjekt och databasformat.
 * Följer DDD-principer genom att hantera mappning och konvertering.
 */
export class TeamMapper {
  /**
   * Konverterar TeamDTO från databas till domänmodell
   */
  static toDomain(dto: TeamDTO): Result<Team, string> {
    try {
      // Validera basdata
      if (!dto.id || !dto.name || !dto.owner_id) {
        return err('Ofullständig team-data från databasen');
      }
      
      // Skapa TeamSettings från dto eller använd standardvärden
      const teamSettingsResult = TeamSettings.create(dto.settings || {
        isPrivate: true,
        requiresApproval: true,
        maxMembers: 50,
        allowGuests: false,
        notificationSettings: {
          newMembers: true,
          memberLeft: true,
          roleChanges: true,
          activityUpdates: true
        }
      });
      
      if (teamSettingsResult.isErr()) {
        return err(`Kunde inte skapa teaminställningar: ${teamSettingsResult.error}`);
      }

      // Konvertera medlemmar
      const members: TeamMember[] = [];
      if (dto.members && Array.isArray(dto.members)) {
        for (const memberDto of dto.members) {
          const memberResult = this.memberToDomain(memberDto);
          if (memberResult.isErr()) {
            return err(`Kunde inte konvertera medlem: ${memberResult.error}`);
          }
          members.push(memberResult.value);
        }
      }

      // Skapa team med fabrikmetoden i Team-entiteten
      const ownerId = new UniqueId(dto.owner_id);
      const teamResult = Team.create({
        name: dto.name,
        description: dto.description,
        ownerId
      });

      if (teamResult.isErr()) {
        return err(`Kunde inte skapa team-domänobjekt: ${teamResult.error}`);
      }

      const team = teamResult.value;
      
      // OBS: Detta är en förenkling - i verkligheten skulle vi hantera
      // skillnaden mellan att skapa ett nytt team och att ladda ett
      // existerande från databasen på ett mer robust sätt

      return ok(team);
    } catch (error) {
      return err(`TeamMapper.toDomain fel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar Team-domänmodell till databasobjekt
   */
  static toPersistence(team: Team): TeamDTO {
    return {
      id: team.id.toString(),
      name: team.name,
      description: team.description,
      owner_id: team.ownerId.toString(),
      created_at: team.createdAt.toISOString(),
      updated_at: team.updatedAt.toISOString(),
      settings: {
        isPrivate: team.settings.isPrivate,
        requiresApproval: team.settings.requiresApproval,
        maxMembers: team.settings.maxMembers,
        allowGuests: team.settings.allowGuests,
        notificationSettings: team.settings.notificationSettings
      },
      members: team.members.map(m => this.memberToPersistence(m, team.id))
    };
  }

  /**
   * Konverterar TeamMemberDTO till domänmodell
   */
  static memberToDomain(dto: TeamMemberDTO): Result<TeamMember, string> {
    try {
      if (!dto.user_id || !dto.role || !dto.joined_at) {
        return err('Ofullständig medlemsdata från databasen');
      }

      // Mappa databasroller till domänroller
      let role: TeamRole;
      switch (dto.role) {
        case 'owner':
          role = TeamRole.OWNER;
          break;
        case 'admin':
          role = TeamRole.ADMIN;
          break;
        case 'member':
          role = TeamRole.MEMBER;
          break;
        default:
          role = TeamRole.MEMBER; // Standardvärde
      }

      return TeamMember.create({
        userId: new UniqueId(dto.user_id),
        role,
        joinedAt: new Date(dto.joined_at)
      });
    } catch (error) {
      return err(`TeamMapper.memberToDomain fel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar TeamMember-domänmodell till databasobjekt
   */
  static memberToPersistence(member: TeamMember, teamId: UniqueId): TeamMemberDTO {
    return {
      team_id: teamId.toString(),
      user_id: member.userId.toString(),
      role: member.role,
      joined_at: member.joinedAt.toISOString()
    };
  }

  /**
   * Konverterar TeamInvitationDTO till domänmodell
   */
  static invitationToDomain(dto: TeamInvitationDTO): Result<TeamInvitation, string> {
    try {
      if (!dto.id || !dto.team_id || !dto.invited_by || !dto.status || !dto.created_at) {
        return err('Ofullständig inbjudningsdata från databasen');
      }

      return TeamInvitation.create({
        id: new UniqueId(dto.id),
        teamId: new UniqueId(dto.team_id),
        userId: new UniqueId(dto.user_id || dto.invited_by), // Fallback för att hantera obligatoriskt userId
        invitedBy: new UniqueId(dto.invited_by),
        email: dto.email,
        status: dto.status as any,
        createdAt: new Date(dto.created_at),
        expiresAt: dto.expires_at ? new Date(dto.expires_at) : undefined,
        respondedAt: dto.responded_at ? new Date(dto.responded_at) : undefined
      });
    } catch (error) {
      return err(`TeamMapper.invitationToDomain fel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar TeamInvitation-domänmodell till databasobjekt
   */
  static invitationToPersistence(invitation: TeamInvitation): TeamInvitationDTO {
    return {
      id: invitation.id.toString(),
      team_id: invitation.teamId.toString(),
      user_id: invitation.userId.toString(),
      invited_by: invitation.invitedBy.toString(),
      email: invitation.email,
      status: invitation.status,
      created_at: invitation.createdAt.toISOString(),
      expires_at: invitation.expiresAt?.toISOString(),
      responded_at: invitation.respondedAt?.toISOString()
    };
  }
} 