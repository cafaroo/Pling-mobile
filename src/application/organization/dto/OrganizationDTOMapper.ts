import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '@/domain/organization/entities/Organization';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { OrganizationSettings } from '@/domain/organization/value-objects/OrganizationSettings';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';

/**
 * DTOs för organization-relaterade operationer i applikationslagret
 */

// CreateOrganizationDTO används i CreateOrganizationUseCase
export interface CreateOrganizationDTO {
  name: string;
  description?: string;
  ownerId: string;
  settings?: {
    maxMembers?: number;
    maxTeams?: number;
    allowPublicTeams?: boolean;
    requireApprovalForTeams?: boolean;
  };
}

// UpdateOrganizationDTO används i UpdateOrganizationUseCase
export interface UpdateOrganizationDTO {
  organizationId: string;
  name?: string;
  description?: string;
  settings?: {
    maxMembers?: number;
    maxTeams?: number;
    allowPublicTeams?: boolean;
    requireApprovalForTeams?: boolean;
  };
}

// AddOrganizationMemberDTO används i AddOrganizationMemberUseCase
export interface AddOrganizationMemberDTO {
  organizationId: string;
  userId: string;
  role: string;
}

// RemoveOrganizationMemberDTO används i RemoveOrganizationMemberUseCase
export interface RemoveOrganizationMemberDTO {
  organizationId: string;
  userId: string;
}

// UpdateOrganizationMemberRoleDTO används i UpdateOrganizationMemberRoleUseCase
export interface UpdateOrganizationMemberRoleDTO {
  organizationId: string;
  userId: string;
  role: string;
}

// AddOrganizationResourceDTO används i AddOrganizationResourceUseCase
export interface AddOrganizationResourceDTO {
  organizationId: string;
  resourceId: string;
  resourceType: string;
  name: string;
  description?: string;
  ownerId?: string;
}

// AddResourcePermissionDTO används i AddResourcePermissionUseCase
export interface AddResourcePermissionDTO {
  organizationId: string;
  resourceId: string;
  subjectId: string;
  subjectType: 'USER' | 'TEAM' | 'ROLE';
  permission: string;
}

// RemoveResourcePermissionDTO används i RemoveResourcePermissionUseCase
export interface RemoveResourcePermissionDTO {
  organizationId: string;
  resourceId: string;
  subjectId: string;
  subjectType: 'USER' | 'TEAM' | 'ROLE';
  permission: string;
}

// OrganizationMemberDTO används för presentation av OrganizationMember
export interface OrganizationMemberDTO {
  userId: string;
  role: string;
  joinedAt: string;
}

// ResourcePermissionDTO används för presentation av en resursbehörighet
export interface ResourcePermissionDTO {
  subjectId: string;
  subjectType: 'USER' | 'TEAM' | 'ROLE';
  permission: string;
}

// OrganizationResourceDTO används för presentation av OrganizationResource
export interface OrganizationResourceDTO {
  id: string;
  organizationId: string;
  resourceType: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  permissions: ResourcePermissionDTO[];
}

// OrganizationDTO används för presentation av Organization-entitet
export interface OrganizationDTO {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: OrganizationMemberDTO[];
  teamIds: string[];
  settings: {
    maxMembers: number;
    maxTeams: number;
    allowPublicTeams: boolean;
    requireApprovalForTeams: boolean;
  };
  resources?: OrganizationResourceDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * OrganizationDTOMapper
 * 
 * Ansvarar för konvertering mellan domänmodell och DTOs i applikationslagret.
 */
export class OrganizationDTOMapper {
  /**
   * Konverterar CreateOrganizationDTO till domänmodell
   */
  static toOrganizationFromCreateDTO(dto: CreateOrganizationDTO): Result<Organization, string> {
    try {
      // Validera obligatoriska fält
      if (!dto.name || !dto.ownerId) {
        return err('Name and ownerId are required');
      }

      // Skapa organization med standardinställningar eller de angivna inställningarna
      const settings = dto.settings || {
        maxMembers: 50,
        maxTeams: 10,
        allowPublicTeams: true,
        requireApprovalForTeams: false
      };

      const settingsResult = OrganizationSettings.create({
        maxMembers: settings.maxMembers ?? 50,
        maxTeams: settings.maxTeams ?? 10,
        allowPublicTeams: settings.allowPublicTeams ?? true,
        requireApprovalForTeams: settings.requireApprovalForTeams ?? false
      });

      if (settingsResult.isErr()) {
        return err(`Invalid organization settings: ${settingsResult.error}`);
      }

      // Skapa Organization med fabrikmetoden
      const organizationResult = Organization.create({
        name: dto.name,
        description: dto.description,
        ownerId: new UniqueId(dto.ownerId),
        settings: settingsResult.value,
        members: [],
        teamIds: [],
        resources: []
      });

      if (organizationResult.isErr()) {
        return err(`Failed to create organization: ${organizationResult.error}`);
      }

      const organization = organizationResult.value;

      // Lägg till ägaren som första medlem
      const memberResult = OrganizationMember.create({
        userId: new UniqueId(dto.ownerId),
        role: OrganizationRole.OWNER,
        joinedAt: new Date()
      });

      if (memberResult.isErr()) {
        return err(`Failed to create organization member: ${memberResult.error}`);
      }

      organization.addMember(memberResult.value);

      return ok(organization);
    } catch (error) {
      return err(`Error in OrganizationDTOMapper.toOrganizationFromCreateDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar en Organization-domänmodell från UpdateOrganizationDTO
   */
  static updateOrganizationFromDTO(organization: Organization, dto: UpdateOrganizationDTO): Result<Organization, string> {
    try {
      if (!dto.organizationId || dto.organizationId !== organization.id.toString()) {
        return err('Invalid organizationId in update operation');
      }

      // Uppdatera namn om det anges
      if (dto.name) {
        organization.updateName(dto.name);
      }

      // Uppdatera beskrivning om det anges
      if (dto.description !== undefined) {
        organization.updateDescription(dto.description);
      }

      // Uppdatera inställningar om det anges
      if (dto.settings) {
        const currentSettings = organization.settings;
        
        const newSettings = {
          maxMembers: dto.settings.maxMembers ?? currentSettings.maxMembers,
          maxTeams: dto.settings.maxTeams ?? currentSettings.maxTeams,
          allowPublicTeams: dto.settings.allowPublicTeams ?? currentSettings.allowPublicTeams,
          requireApprovalForTeams: dto.settings.requireApprovalForTeams ?? currentSettings.requireApprovalForTeams
        };

        const settingsResult = OrganizationSettings.create(newSettings);
        if (settingsResult.isErr()) {
          return err(`Invalid organization settings: ${settingsResult.error}`);
        }

        organization.updateSettings(settingsResult.value);
      }

      return ok(organization);
    } catch (error) {
      return err(`Error in OrganizationDTOMapper.updateOrganizationFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar OrganizationMember-värdobjekt till DTO
   */
  static organizationMemberToDTO(member: OrganizationMember): OrganizationMemberDTO {
    return {
      userId: member.userId.toString(),
      role: member.role,
      joinedAt: member.joinedAt.toISOString()
    };
  }

  /**
   * Konverterar OrganizationMemberDTO till domänmodell
   */
  static toOrganizationMemberFromDTO(dto: OrganizationMemberDTO): Result<OrganizationMember, string> {
    try {
      if (!dto.userId || !dto.role) {
        return err('userId and role are required for OrganizationMemberDTO');
      }

      return OrganizationMember.create({
        userId: new UniqueId(dto.userId),
        role: dto.role as OrganizationRole,
        joinedAt: new Date(dto.joinedAt || new Date())
      });
    } catch (error) {
      return err(`Error in OrganizationDTOMapper.toOrganizationMemberFromDTO: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Konverterar OrganizationResource-entitet till DTO
   */
  static organizationResourceToDTO(resource: OrganizationResource): OrganizationResourceDTO {
    return {
      id: resource.id.toString(),
      organizationId: resource.organizationId.toString(),
      resourceType: resource.resourceType,
      name: resource.name,
      description: resource.description,
      ownerId: resource.ownerId.toString(),
      createdAt: resource.createdAt.toISOString(),
      permissions: resource.permissions.map(p => ({
        subjectId: p.subjectId.toString(),
        subjectType: p.subjectType as 'USER' | 'TEAM' | 'ROLE',
        permission: p.permission
      }))
    };
  }

  /**
   * Konverterar Organization-domänmodell till DTO för presentation
   */
  static toDTO(organization: Organization): OrganizationDTO {
    return {
      id: organization.id.toString(),
      name: organization.name,
      description: organization.description,
      ownerId: organization.ownerId.toString(),
      members: organization.members.map(member => this.organizationMemberToDTO(member)),
      teamIds: organization.teamIds.map(id => id.toString()),
      settings: {
        maxMembers: organization.settings.maxMembers,
        maxTeams: organization.settings.maxTeams,
        allowPublicTeams: organization.settings.allowPublicTeams,
        requireApprovalForTeams: organization.settings.requireApprovalForTeams
      },
      resources: organization.resources?.map(resource => this.organizationResourceToDTO(resource)),
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    };
  }

  /**
   * Konverterar flera Organization-entiteter till DTOs
   */
  static toDTOList(organizations: Organization[]): OrganizationDTO[] {
    return organizations.map(organization => this.toDTO(organization));
  }
} 