import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationMember } from '@/domain/organization/entities/OrganizationMember';
import { OrganizationName } from '@/domain/organization/value-objects/OrganizationName';
import { OrganizationSettings } from '@/domain/organization/value-objects/OrganizationSettings';
import { OrganizationInvitation, InvitationStatus } from '@/domain/organization/value-objects/OrganizationInvitation';
import { OrgSettings } from '@/domain/organization/value-objects/OrgSettings';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';

/**
 * DTO från Supabase-databasen
 */
export interface OrganizationDTO {
  id: string;
  name: string;
  owner_id: string;
  members?: {
    user_id: string;
    role: string;
    joined_at: string;
  }[];
  team_ids?: string[];
  settings?: {
    subscription?: string;
    features?: string[];
    brand?: {
      color?: string;
      logo?: string;
    };
    visibility?: string;
  };
  created_at?: string;
  updated_at?: string;
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

/**
 * OrganizationMapper
 * 
 * Ansvarar för konvertering mellan domänobjekt och databasformat.
 * Följer DDD-principer genom att hantera mappning och konvertering.
 */
export class OrganizationMapper {
  /**
   * Konverterar OrganizationDTO från databas till domänmodell
   */
  static toDomain(dto: OrganizationDTO): Result<Organization, string> {
    try {
      // Validera basdata
      if (!dto.id || !dto.name || !dto.owner_id) {
        return err('Ofullständig organisationsdata från databasen');
      }

      // Validera organisationsnamn
      const nameResult = OrganizationName.create(dto.name);
      if (nameResult.isErr()) {
        return err(`Ogiltigt organisationsnamn: ${nameResult.error}`);
      }

      // Skapa standardinställningar om de saknas
      const defaultSettings = {
        subscription: 'free',
        features: [],
        brand: {
          color: '#4A90E2',
          logo: ''
        },
        visibility: 'private'
      };

      // Kombinera med befintliga inställningar om de finns
      const settingsData = dto.settings || defaultSettings;
      const settingsResult = OrganizationSettings.create({
        subscription: settingsData.subscription || defaultSettings.subscription,
        features: settingsData.features || defaultSettings.features,
        brand: {
          ...defaultSettings.brand,
          ...settingsData.brand
        },
        visibility: settingsData.visibility || defaultSettings.visibility
      });

      if (settingsResult.isErr()) {
        return err(`Ogiltiga inställningar: ${settingsResult.error}`);
      }

      // Skapa medlemmar
      const members: OrganizationMember[] = [];
      if (dto.members && dto.members.length > 0) {
        for (const member of dto.members) {
          members.push(
            new OrganizationMember({
              userId: new UniqueId(member.user_id),
              role: member.role,
              joinedAt: new Date(member.joined_at)
            })
          );
        }
      }

      // Lägg alltid till ägaren som medlem om den inte redan finns
      const ownerExists = members.some(m => m.userId.toString() === dto.owner_id);
      if (!ownerExists) {
        members.push(
          new OrganizationMember({
            userId: new UniqueId(dto.owner_id),
            role: 'owner',
            joinedAt: dto.created_at ? new Date(dto.created_at) : new Date()
          })
        );
      }

      // Skapa organisation
      const organization = new Organization({
        id: new UniqueId(dto.id),
        name: nameResult.value,
        ownerId: new UniqueId(dto.owner_id),
        members,
        teamIds: dto.team_ids?.map(id => new UniqueId(id)) || [],
        settings: settingsResult.value,
        createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
        updatedAt: dto.updated_at ? new Date(dto.updated_at) : new Date()
      });
      
      return ok(organization);
    } catch (error) {
      return err(`OrganizationMapper.toDomain fel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar Organization-domänmodell till databasobjekt
   */
  static toPersistence(organization: Organization): OrganizationDTO {
    try {
      return {
        id: organization.id.toString(),
        name: organization.name.value,
        owner_id: organization.ownerId.toString(),
        members: organization.members.map(member => ({
          user_id: member.userId.toString(),
          role: member.role,
          joined_at: member.joinedAt.toISOString()
        })),
        team_ids: organization.teamIds.map(id => id.toString()),
        settings: {
          subscription: organization.settings.subscription,
          features: organization.settings.features,
          brand: organization.settings.brand,
          visibility: organization.settings.visibility
        },
        created_at: organization.createdAt.toISOString(),
        updated_at: organization.updatedAt.toISOString()
      };
    } catch (error) {
      console.error(`OrganizationMapper.toPersistence fel: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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