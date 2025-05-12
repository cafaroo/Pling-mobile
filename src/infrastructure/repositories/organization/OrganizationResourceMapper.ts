import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationResource, ResourcePermissionAssignment } from '@/domain/organization/entities/OrganizationResource';
import { ResourceType } from '@/domain/organization/value-objects/ResourceType';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';

// DTO för organization_resources-tabellen
export interface OrganizationResourceDTO {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: string;
  owner_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// DTO för resource_permissions-tabellen
export interface ResourcePermissionDTO {
  id: string;
  resource_id: string;
  user_id?: string;
  team_id?: string;
  role?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export class OrganizationResourceMapper {
  /**
   * Konverterar DTOs från databasen till domänmodell
   */
  public static toDomain(
    resourceDTO: OrganizationResourceDTO, 
    permissionsDTO: ResourcePermissionDTO[] = []
  ): OrganizationResource {
    const id = new UniqueId(resourceDTO.id);
    const organizationId = new UniqueId(resourceDTO.organization_id);
    const ownerId = new UniqueId(resourceDTO.owner_id);
    
    // Konvertera permissions till ResourcePermissionAssignment
    const permissionAssignments: ResourcePermissionAssignment[] = permissionsDTO.map(permissionDTO => ({
      userId: permissionDTO.user_id ? new UniqueId(permissionDTO.user_id) : undefined,
      teamId: permissionDTO.team_id ? new UniqueId(permissionDTO.team_id) : undefined,
      role: permissionDTO.role,
      permissions: permissionDTO.permissions.map(p => p as ResourcePermission)
    }));

    // Skapa resource via factory för att få all validering
    const resourceOrError = OrganizationResource.create({
      name: resourceDTO.name,
      description: resourceDTO.description,
      type: resourceDTO.type as ResourceType,
      organizationId: organizationId,
      ownerId: ownerId,
      metadata: resourceDTO.metadata,
      permissionAssignments: permissionAssignments
    });

    // Här antar vi att alla data från databasen är giltiga
    const resource = resourceOrError.value;
    
    // Ersätt automatgenererade data med data från databasen
    Object.assign(resource['props'], {
      id,
      createdAt: new Date(resourceDTO.created_at),
      updatedAt: new Date(resourceDTO.updated_at)
    });

    return resource;
  }

  /**
   * Konverterar domänmodell till DTOs för databasen
   */
  public static toDTO(resource: OrganizationResource): {
    resource: OrganizationResourceDTO,
    permissions: ResourcePermissionDTO[]
  } {
    // Konvertera huvudresursen
    const resourceDTO: OrganizationResourceDTO = {
      id: resource.id.toString(),
      organization_id: resource.organizationId.toString(),
      name: resource.name,
      description: resource.description,
      type: resource.type,
      owner_id: resource.ownerId.toString(),
      metadata: resource.metadata,
      created_at: resource.createdAt.toISOString(),
      updated_at: resource.updatedAt.toISOString()
    };

    // Konvertera behörigheter
    const permissionsDTO: ResourcePermissionDTO[] = resource.permissionAssignments.map(
      (assignment, index) => ({
        id: `temp_id_${index}`, // ID kommer att genereras av databasen
        resource_id: resource.id.toString(),
        user_id: assignment.userId?.toString(),
        team_id: assignment.teamId?.toString(),
        role: assignment.role,
        permissions: assignment.permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    );

    return {
      resource: resourceDTO,
      permissions: permissionsDTO
    };
  }
} 