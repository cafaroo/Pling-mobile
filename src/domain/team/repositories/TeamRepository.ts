import { Team } from '../entities/Team';
import { TeamMember } from '../entities/TeamMember';
import { TeamInvitation } from '../entities/TeamInvitation';
import { Result } from '@/shared/core/Result';
import { UniqueId } from '@/shared/domain/UniqueId';

export interface TeamRepository {
  findById(id: UniqueId): Promise<Team | null>;
  findByOwnerId(ownerId: UniqueId): Promise<Team[]>;
  findByMemberId(userId: UniqueId): Promise<Team[]>;
  save(team: Team): Promise<void>;
  delete(id: UniqueId): Promise<void>;
  
  // Medlemshantering
  addMember(teamId: UniqueId, member: TeamMember): Promise<Result<void, Error>>;
  updateMemberRole(teamId: UniqueId, userId: UniqueId, role: string): Promise<Result<void, Error>>;
  removeMember(teamId: UniqueId, userId: UniqueId): Promise<Result<void, Error>>;
  
  // Inbjudningshantering
  createInvitation(invitation: TeamInvitation): Promise<Result<void, Error>>;
  findInvitationById(id: UniqueId): Promise<TeamInvitation | null>;
  findInvitationsByTeamId(teamId: UniqueId): Promise<TeamInvitation[]>;
  acceptInvitation(id: UniqueId): Promise<Result<void, Error>>;
  deleteInvitation(id: UniqueId): Promise<void>;
} 