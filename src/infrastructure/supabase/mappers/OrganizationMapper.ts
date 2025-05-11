import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';
import { OrganizationInvitation, InvitationStatus } from '@/domain/organization/value-objects/OrganizationInvitation';
import { OrgSettings } from '@/domain/organization/value-objects/OrgSettings';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { UniqueId } from '@/shared/core/UniqueId';

interface OrganizationDTO {
  id: string;
  name: string;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  members: OrganizationMemberDTO[];
  invitations?: OrganizationInvitationDTO[];
  team_ids?: string[];
}

interface OrganizationMemberDTO {
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface OrganizationInvitationDTO {
  id: string;
  organization_id: string;
  user_id: string;
  invited_by: string;
  email?: string;
  status: string;
  expires_at: string;
  created_at: string;
  responded_at?: string;
}

export class OrganizationMapper {
  static toDomain(dto: OrganizationDTO): Organization {
    // Skapa settings först
    const settingsResult = OrgSettings.create({
      isPrivate: dto.settings?.isPrivate ?? true,
      requiresApproval: dto.settings?.requiresApproval ?? true,
      maxMembers: dto.settings?.maxMembers ?? 100,
      allowGuests: dto.settings?.allowGuests ?? false,
      notificationSettings: {
        newMembers: dto.settings?.notificationSettings?.newMembers ?? true,
        memberLeft: dto.settings?.notificationSettings?.memberLeft ?? true,
        roleChanges: dto.settings?.notificationSettings?.roleChanges ?? true,
        activityUpdates: dto.settings?.notificationSettings?.activityUpdates ?? true
      }
    });

    if (settingsResult.isErr()) {
      throw new Error(`Kunde inte mappa inställningar: ${settingsResult.error}`);
    }

    // Konvertera medlemmar
    const members = (dto.members || []).map(m => {
      const memberResult = OrganizationMember.create({
        userId: new UniqueId(m.user_id),
        role: m.role as OrganizationRole,
        joinedAt: new Date(m.joined_at)
      });

      if (memberResult.isErr()) {
        throw new Error(`Kunde inte mappa medlem: ${memberResult.error}`);
      }

      return memberResult.value;
    });

    // Konvertera invitations om de finns
    const invitations = (dto.invitations || []).map(i => {
      const invitationResult = OrganizationInvitation.create({
        id: i.id,
        organizationId: new UniqueId(i.organization_id),
        userId: new UniqueId(i.user_id),
        invitedBy: new UniqueId(i.invited_by),
        email: i.email,
        status: i.status as InvitationStatus,
        expiresAt: new Date(i.expires_at),
        createdAt: new Date(i.created_at),
        respondedAt: i.responded_at ? new Date(i.responded_at) : undefined
      });

      if (invitationResult.isErr()) {
        throw new Error(`Kunde inte mappa inbjudan: ${invitationResult.error}`);
      }

      return invitationResult.value;
    });

    // Konvertera team IDs om de finns
    const teamIds = (dto.team_ids || []).map(id => new UniqueId(id));

    // Skapa domänobjekt
    const orgResult = Organization.create({
      id: new UniqueId(dto.id),
      name: dto.name,
      ownerId: new UniqueId(dto.owner_id),
      settings: settingsResult.value,
      members,
      invitations,
      teamIds,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    });

    if (orgResult.isErr()) {
      throw new Error(`Kunde inte mappa organisation: ${orgResult.error}`);
    }

    return orgResult.value;
  }

  static toPersistence(organization: Organization): {
    id: string;
    name: string;
    owner_id: string;
    settings: Record<string, any>;
    updated_at: string;
    members: OrganizationMemberDTO[];
    invitations: OrganizationInvitationDTO[];
    team_ids?: string[];
  } {
    return {
      id: organization.id.toString(),
      name: organization.name,
      owner_id: organization.ownerId.toString(),
      settings: organization.settings.toJSON(),
      updated_at: organization.updatedAt.toISOString(),
      members: organization.members.map(m => ({
        organization_id: organization.id.toString(),
        user_id: m.userId.toString(),
        role: m.role,
        joined_at: m.joinedAt.toISOString()
      })),
      invitations: organization.invitations.map(i => ({
        id: i.id.toString(),
        organization_id: organization.id.toString(),
        user_id: i.userId.toString(),
        invited_by: i.invitedBy.toString(),
        email: i.email,
        status: i.status,
        expires_at: i.expiresAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: i.createdAt.toISOString(),
        responded_at: i.respondedAt?.toISOString()
      })),
      team_ids: organization.teamIds.map(id => id.toString())
    };
  }

  static memberToDomain(dto: OrganizationMemberDTO): OrganizationMember {
    const result = OrganizationMember.create({
      userId: new UniqueId(dto.user_id),
      role: dto.role as OrganizationRole,
      joinedAt: new Date(dto.joined_at)
    });

    if (result.isErr()) {
      throw new Error(`Kunde inte mappa medlem: ${result.error}`);
    }

    return result.value;
  }

  static memberToPersistence(organizationId: string, member: OrganizationMember): OrganizationMemberDTO {
    return {
      organization_id: organizationId,
      user_id: member.userId.toString(),
      role: member.role,
      joined_at: member.joinedAt.toISOString()
    };
  }

  static invitationToDomain(dto: OrganizationInvitationDTO): OrganizationInvitation {
    const result = OrganizationInvitation.create({
      id: dto.id,
      organizationId: new UniqueId(dto.organization_id),
      userId: new UniqueId(dto.user_id),
      invitedBy: new UniqueId(dto.invited_by),
      email: dto.email,
      status: dto.status as InvitationStatus,
      expiresAt: new Date(dto.expires_at),
      createdAt: new Date(dto.created_at),
      respondedAt: dto.responded_at ? new Date(dto.responded_at) : undefined
    });

    if (result.isErr()) {
      throw new Error(`Kunde inte mappa inbjudan: ${result.error}`);
    }

    return result.value;
  }

  static invitationToPersistence(invitation: OrganizationInvitation): OrganizationInvitationDTO {
    return {
      id: invitation.id.toString(),
      organization_id: invitation.organizationId.toString(),
      user_id: invitation.userId.toString(),
      invited_by: invitation.invitedBy.toString(),
      email: invitation.email,
      status: invitation.status,
      expires_at: invitation.expiresAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: invitation.createdAt.toISOString(),
      responded_at: invitation.respondedAt?.toISOString()
    };
  }
} 