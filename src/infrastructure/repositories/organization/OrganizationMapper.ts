import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { OrgSettings } from '@/domain/organization/value-objects/OrgSettings';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';

export type OrganizationDTO = {
  id: string;
  name: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberDTO = {
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

export type OrganizationInvitationDTO = {
  id: string;
  organization_id: string;
  user_id: string;
  invited_by: string;
  email?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  responded_at?: string;
};

export class OrganizationMapper {
  public static toDomain(
    dto: OrganizationDTO, 
    membersDTO: OrganizationMemberDTO[] = [],
    invitationsDTO: OrganizationInvitationDTO[] = [],
    teamIds: string[] = []
  ): Organization {
    const id = new UniqueId(dto.id);
    const ownerId = new UniqueId(dto.owner_id);
    
    // Konvertera medlemmar
    const members = membersDTO.map(memberDTO => OrganizationMember.create({
      userId: memberDTO.user_id,
      role: memberDTO.role as OrganizationRole,
      joinedAt: new Date(memberDTO.joined_at)
    }).value);

    // Konvertera inbjudningar
    const invitations = invitationsDTO.map(invitationDTO => 
      OrganizationInvitation.create({
        id: invitationDTO.id,
        organizationId: invitationDTO.organization_id,
        userId: invitationDTO.user_id,
        invitedBy: invitationDTO.invited_by,
        email: invitationDTO.email,
        status: invitationDTO.status,
        expiresAt: new Date(invitationDTO.expires_at),
        createdAt: new Date(invitationDTO.created_at),
        respondedAt: invitationDTO.responded_at ? new Date(invitationDTO.responded_at) : undefined
      }).value
    );

    // Konvertera team-IDs
    const domainTeamIds = teamIds.map(id => new UniqueId(id));

    // Konvertera inställningar
    const settings = OrgSettings.create(dto.settings).value;

    // Skapa och returnera Organization-entitet
    const organizationOrError = Organization.create({
      name: dto.name,
      ownerId: ownerId
    });

    // Här antar vi att create fungerar, eftersom vi validerar data från databasen
    const organization = organizationOrError.value;
    
    // Ersätt den automatiskt genererade inre state med data från DTO
    Object.assign(organization['props'], {
      id,
      name: dto.name,
      ownerId,
      settings,
      members,
      invitations,
      teamIds: domainTeamIds,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    });

    return organization;
  }

  public static toDTO(domain: Organization): {
    organization: OrganizationDTO;
    members: OrganizationMemberDTO[];
    invitations: OrganizationInvitationDTO[];
  } {
    return {
      organization: {
        id: domain.id.toString(),
        name: domain.name,
        owner_id: domain.ownerId.toString(),
        settings: domain.settings.toValue(),
        created_at: domain.createdAt.toISOString(),
        updated_at: domain.updatedAt.toISOString()
      },
      members: domain.members.map(member => ({
        organization_id: domain.id.toString(),
        user_id: member.userId.toString(),
        role: member.role.toString(),
        joined_at: member.joinedAt.toISOString()
      })),
      invitations: domain.invitations.map(invitation => ({
        id: invitation.id.toString(),
        organization_id: domain.id.toString(),
        user_id: invitation.userId.toString(),
        invited_by: invitation.invitedBy.toString(),
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expiresAt?.toISOString() || new Date().toISOString(),
        created_at: invitation.createdAt.toISOString(),
        responded_at: invitation.respondedAt?.toISOString()
      }))
    };
  }
} 