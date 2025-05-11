import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '../entities/Organization';
import { OrganizationInvitation } from '../value-objects/OrganizationInvitation';
import { Result } from '@/shared/core/Result';

export interface OrganizationRepository {
  findById(id: UniqueId): Promise<Result<Organization, string>>;
  findByOwnerId(ownerId: UniqueId): Promise<Result<Organization[], string>>;
  findByMemberId(userId: UniqueId): Promise<Result<Organization[], string>>;
  findByTeamId(teamId: UniqueId): Promise<Result<Organization, string>>;
  findInvitationsByUserId(userId: UniqueId): Promise<Result<OrganizationInvitation[], string>>;
  save(organization: Organization): Promise<Result<void, string>>;
  delete(id: UniqueId): Promise<Result<void, string>>;
  exists(id: UniqueId): Promise<boolean>;
} 