import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamInvitation } from '@/domain/team/entities/TeamInvitation';
import { UniqueId } from '@/shared/domain/UniqueId';

interface TeamDTO {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  members: TeamMemberDTO[];
}

interface TeamMemberDTO {
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface TeamInvitationDTO {
  id: string;
  team_id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

export class TeamMapper {
  static toDomain(dto: TeamDTO): Team {
    return Team.create({
      id: new UniqueId(dto.id),
      name: dto.name,
      description: dto.description,
      ownerId: new UniqueId(dto.owner_id),
      members: dto.members.map(m => TeamMember.create({
        userId: new UniqueId(m.user_id),
        role: m.role,
        joinedAt: new Date(m.joined_at)
      })),
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    }).value as Team; // Vi antar att create alltid lyckas här
  }

  static toPersistence(team: Team): {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    members: TeamMemberDTO[];
  } {
    return {
      id: team.id.toString(),
      name: team.name,
      description: team.description,
      owner_id: team.ownerId.toString(),
      members: team.members.map(m => ({
        team_id: team.id.toString(),
        user_id: m.userId.toString(),
        role: m.role,
        joined_at: m.joinedAt.toISOString()
      }))
    };
  }

  static invitationToDomain(dto: TeamInvitationDTO): TeamInvitation {
    return TeamInvitation.create({
      id: new UniqueId(dto.id),
      teamId: new UniqueId(dto.team_id),
      email: dto.email,
      role: dto.role,
      createdAt: new Date(dto.created_at),
      expiresAt: new Date(dto.expires_at),
      acceptedAt: dto.accepted_at ? new Date(dto.accepted_at) : undefined
    }).value as TeamInvitation;
  }

  static invitationToPersistence(invitation: TeamInvitation): {
    id: string;
    team_id: string;
    email: string;
    role: string;
    expires_at: string;
    accepted_at?: string;
  } {
    return {
      id: invitation.id.toString(),
      team_id: invitation.teamId.toString(),
      email: invitation.email,
      role: invitation.role,
      expires_at: invitation.expiresAt.toISOString(),
      accepted_at: invitation.acceptedAt?.toISOString()
    };
  }
} 