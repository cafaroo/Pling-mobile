import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { TeamName } from '@/domain/team/value-objects/TeamName';
import { TeamDescription } from '@/domain/team/value-objects/TeamDescription';
import { TeamSettings } from '@/domain/team/entities/TeamSettings';

/**
 * DTOs för team-relaterade operationer i applikationslagret
 */

// CreateTeamDTO används i CreateTeamUseCase
export interface CreateTeamDTO {
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  settings?: {
    isPrivate?: boolean;
    requiresApproval?: boolean;
    maxMembers?: number;
    allowGuests?: boolean;
    notificationSettings?: {
      newMembers?: boolean;
      memberLeft?: boolean;
      roleChanges?: boolean;
      activityUpdates?: boolean;
    };
  };
}

// UpdateTeamDTO används i UpdateTeamUseCase
export interface UpdateTeamDTO {
  teamId: string;
  name?: string;
  description?: string;
  settings?: {
    isPrivate?: boolean;
    requiresApproval?: boolean;
    maxMembers?: number;
    allowGuests?: boolean;
    notificationSettings?: {
      newMembers?: boolean;
      memberLeft?: boolean;
      roleChanges?: boolean;
      activityUpdates?: boolean;
    };
  };
}

// AddTeamMemberDTO används i AddTeamMemberUseCase
export interface AddTeamMemberDTO {
  teamId: string;
  userId: string;
  role: string;
}

// RemoveTeamMemberDTO används i RemoveTeamMemberUseCase
export interface RemoveTeamMemberDTO {
  teamId: string;
  userId: string;
}

// TeamMemberDTO används för presentation och överföring av TeamMember-värdobjekt
export interface TeamMemberDTO {
  userId: string;
  role: string;
  joinedAt: string;
}

// TeamDTO används för presentation och överföring av Team-entitet
export interface TeamDTO {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  organizationId?: string;
  members: TeamMemberDTO[];
  settings: {
    isPrivate: boolean;
    requiresApproval: boolean;
    maxMembers: number;
    allowGuests: boolean;
    notificationSettings: {
      newMembers: boolean;
      memberLeft: boolean;
      roleChanges: boolean;
      activityUpdates: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * TeamDTOMapper
 * 
 * Ansvarar för konvertering mellan domänmodell och DTOs i applikationslagret.
 */
export class TeamDTOMapper {
  /**
   * Konverterar CreateTeamDTO till domänmodell
   */
  static toTeamFromCreateDTO(dto: CreateTeamDTO): Result<Team> {
    try {
      // Validera obligatoriska fält
      if (!dto.name || !dto.ownerId) {
        return err('Name and ownerId are required');
      }

      // Validera name och description med värdobjekt
      const nameResult = TeamName.create(dto.name);
      if (nameResult.isErr()) {
        return err(`Invalid team name: ${nameResult.error}`);
      }

      let descriptionResult;
      if (dto.description) {
        descriptionResult = TeamDescription.create(dto.description);
        if (descriptionResult.isErr()) {
          return err(`Invalid team description: ${descriptionResult.error}`);
        }
      }

      // Skapa team med standardinställningar eller de angivna inställningarna
      const settings = dto.settings || {
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
      };

      const settingsResult = TeamSettings.create(settings);
      if (settingsResult.isErr()) {
        return err(`Invalid team settings: ${settingsResult.error}`);
      }

      // Skapa team med fabrikmetoden
      const teamResult = Team.create({
        name: nameResult.value.value,
        description: descriptionResult ? descriptionResult.value.value : undefined,
        ownerId: new UniqueId(dto.ownerId),
        organizationId: dto.organizationId ? new UniqueId(dto.organizationId) : undefined
      });

      if (teamResult.isErr()) {
        return err(`Failed to create team: ${teamResult.error}`);
      }

      const team = teamResult.value;
      
      // Uppdatera inställningar
      team.updateSettings(settings);

      return ok(team);
    } catch (error) {
      return err(`Error in TeamDTOMapper.toTeamFromCreateDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar UpdateTeamDTO till domänmodell
   */
  static updateTeamFromDTO(team: Team, dto: UpdateTeamDTO): Result<Team> {
    try {
      if (!dto.teamId || dto.teamId !== team.id.toString()) {
        return err('Invalid teamId in update operation');
      }

      // Uppdatera namn om det anges
      if (dto.name) {
        const nameResult = TeamName.create(dto.name);
        if (nameResult.isErr()) {
          return err(`Invalid team name: ${nameResult.error}`);
        }
        team.updateName(nameResult.value.value);
      }

      // Uppdatera beskrivning om det anges
      if (dto.description !== undefined) {
        if (dto.description) {
          const descriptionResult = TeamDescription.create(dto.description);
          if (descriptionResult.isErr()) {
            return err(`Invalid team description: ${descriptionResult.error}`);
          }
          team.updateDescription(descriptionResult.value.value);
        } else {
          team.updateDescription(''); // Tom beskrivning
        }
      }

      // Uppdatera inställningar om det anges
      if (dto.settings) {
        team.updateSettings(dto.settings);
      }

      return ok(team);
    } catch (error) {
      return err(`Error in TeamDTOMapper.updateTeamFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar TeamMember-värdobjekt till DTO
   */
  static teamMemberToDTO(member: TeamMember): TeamMemberDTO {
    return {
      userId: member.userId.toString(),
      role: member.role,
      joinedAt: member.joinedAt.toISOString()
    };
  }

  /**
   * Konverterar TeamMemberDTO till domänmodell
   */
  static toTeamMemberFromDTO(dto: TeamMemberDTO): Result<TeamMember> {
    try {
      if (!dto.userId || !dto.role) {
        return err('userId and role are required for TeamMemberDTO');
      }

      return TeamMember.create({
        userId: new UniqueId(dto.userId),
        role: dto.role as TeamRole,
        joinedAt: new Date(dto.joinedAt || new Date())
      });
    } catch (error) {
      return err(`Error in TeamDTOMapper.toTeamMemberFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar team-domänmodell till DTO för presentation
   */
  static toDTO(team: Team): TeamDTO {
    return {
      id: team.id.toString(),
      name: team.name,
      description: team.description,
      ownerId: team.ownerId.toString(),
      organizationId: team.organizationId?.toString(),
      members: team.members.map(member => this.teamMemberToDTO(member)),
      settings: {
        isPrivate: team.settings.isPrivate,
        requiresApproval: team.settings.requiresApproval,
        maxMembers: team.settings.maxMembers,
        allowGuests: team.settings.allowGuests,
        notificationSettings: team.settings.notificationSettings
      },
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    };
  }

  /**
   * Konverterar flera team-entiteter till DTOs
   */
  static toDTOList(teams: Team[]): TeamDTO[] {
    return teams.map(team => this.toDTO(team));
  }
} 