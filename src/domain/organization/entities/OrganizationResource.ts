import { AggregateRoot, AggregateRootProps } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { ResourceType } from '../value-objects/ResourceType';
import { ResourcePermission } from '../value-objects/ResourcePermission';
import { ResourceCreated, ResourceUpdated, ResourceDeleted, ResourcePermissionAdded, ResourcePermissionRemoved, ResourceOwnerChanged } from '../events/ResourceEvents';

export interface ResourcePermissionAssignment {
  userId?: UniqueId;
  teamId?: UniqueId;
  role?: string;
  permissions: ResourcePermission[];
}

export interface OrganizationResourceProps extends AggregateRootProps {
  organizationId: UniqueId;
  name: string;
  description?: string;
  type: ResourceType;
  ownerId: UniqueId;
  metadata: Record<string, any>;
  permissionAssignments: ResourcePermissionAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationResourceCreateDTO {
  name: string;
  description?: string;
  type: ResourceType;
  organizationId: string | UniqueId;
  ownerId: string | UniqueId;
  metadata?: Record<string, any>;
  permissionAssignments?: ResourcePermissionAssignment[];
}

export interface OrganizationResourceUpdateDTO {
  name?: string;
  description?: string;
  ownerId?: string | UniqueId;
  metadata?: Record<string, any>;
  permissionAssignments?: ResourcePermissionAssignment[];
}

export class OrganizationResource extends AggregateRoot<OrganizationResourceProps> {
  private constructor(props: OrganizationResourceProps) {
    super(props);
  }

  // Getters
  get id(): UniqueId {
    return this.props.id;
  }

  get organizationId(): UniqueId {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): ResourceType {
    return this.props.type;
  }

  get ownerId(): UniqueId {
    return this.props.ownerId;
  }

  get metadata(): Record<string, any> {
    return { ...this.props.metadata };
  }

  get permissionAssignments(): ResourcePermissionAssignment[] {
    return [...this.props.permissionAssignments];
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Metoder för att hantera behörigheter
  public hasPermission(userId: UniqueId, permission: ResourcePermission): boolean {
    // Resursägaren har alltid alla behörigheter
    if (this.props.ownerId.equals(userId)) {
      return true;
    }

    // Kontrollera användarbehörigheter
    const userAssignment = this.props.permissionAssignments.find(
      assignment => assignment.userId && assignment.userId.equals(userId)
    );

    if (userAssignment && userAssignment.permissions.includes(permission)) {
      return true;
    }

    // Om team-behörigheter ska kontrolleras behöver vi utöka med en check mot team-medlemskap
    // Detta skulle kräva att vi har tillgång till team-information, vilket kan ske via en servicehanterare

    return false;
  }

  // Metod för att lägga till behörigheter
  public addPermission(assignment: ResourcePermissionAssignment): Result<void, string> {
    try {
      // Validera input
      if (!assignment.userId && !assignment.teamId && !assignment.role) {
        return err('En behörighetstilldelning måste ha antingen en användare, ett team eller en roll');
      }

      if (!assignment.permissions || assignment.permissions.length === 0) {
        return err('Behörighetstilldelning måste innehålla minst en behörighet');
      }

      // Hitta befintlig tilldelning om den finns
      let existingIndex = -1;
      
      if (assignment.userId) {
        existingIndex = this.props.permissionAssignments.findIndex(
          a => a.userId && a.userId.equals(assignment.userId!)
        );
      } else if (assignment.teamId) {
        existingIndex = this.props.permissionAssignments.findIndex(
          a => a.teamId && a.teamId.equals(assignment.teamId!)
        );
      } else if (assignment.role) {
        existingIndex = this.props.permissionAssignments.findIndex(
          a => a.role === assignment.role
        );
      }

      // Om det finns en befintlig tilldelning
      if (existingIndex >= 0) {
        const existing = this.props.permissionAssignments[existingIndex];
        
        // Kontrollera om vi försöker lägga till exakt samma behörigheter som redan finns
        const allPermissionsAlreadyExist = assignment.permissions.every(p => 
          existing.permissions.includes(p)
        );
        
        if (allPermissionsAlreadyExist) {
          return err('Dessa behörigheter finns redan för denna tilldelning');
        }
        
        // Slå samman existerande och nya behörigheter, se till att inga dubbletter
        const mergedPermissions = [...existing.permissions];
        
        // Lägg till nya behörigheter som inte redan finns
        for (const permission of assignment.permissions) {
          if (!mergedPermissions.includes(permission)) {
            mergedPermissions.push(permission);
          }
        }
        
        // Uppdatera den befintliga tilldelningen
        this.props.permissionAssignments[existingIndex] = {
          ...existing,
          permissions: mergedPermissions
        };
      } else {
        // Lägg till ny tilldelning om den inte finns
        this.props.permissionAssignments.push({
          userId: assignment.userId,
          teamId: assignment.teamId,
          role: assignment.role,
          permissions: [...assignment.permissions]
        });
      }

      this.props.updatedAt = new Date();

      // Skapa domänhändelse
      this.addDomainEvent(new ResourcePermissionAdded(
        this.id,
        this.organizationId,
        assignment.permissions,
        assignment.userId,
        assignment.teamId,
        assignment.role
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till behörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Metod för att ta bort behörigheter
  public removePermission(userId?: UniqueId, teamId?: UniqueId, role?: string): Result<void, string> {
    try {
      if (!userId && !teamId && !role) {
        return err('Måste ange antingen användare, team eller roll för att ta bort behörighet');
      }

      let removedAny = false;
      
      this.props.permissionAssignments = this.props.permissionAssignments.filter(assignment => {
        const shouldRemove = 
          (userId && assignment.userId && assignment.userId.equals(userId)) ||
          (teamId && assignment.teamId && assignment.teamId.equals(teamId)) ||
          (role && assignment.role === role);
        
        if (shouldRemove) {
          removedAny = true;
          return false;
        }
        return true;
      });

      if (!removedAny) {
        return err('Ingen matchande behörighetstilldelning hittades');
      }

      this.props.updatedAt = new Date();
      
      // Skapa domänhändelse
      this.addDomainEvent(new ResourcePermissionRemoved(
        this.id,
        this.organizationId,
        userId,
        teamId,
        role
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort behörighet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Metod för att uppdatera resursen
  public update(data: OrganizationResourceUpdateDTO): Result<void, string> {
    try {
      const updatedFields: string[] = [];
      let previousOwnerId: UniqueId | undefined;

      if (data.name !== undefined) {
        if (data.name.trim().length < 2) {
          return err('Resursnamn måste vara minst 2 tecken');
        }
        this.props.name = data.name.trim();
        updatedFields.push('name');
      }

      if (data.description !== undefined) {
        this.props.description = data.description.trim() || undefined;
        updatedFields.push('description');
      }

      if (data.ownerId !== undefined) {
        previousOwnerId = this.props.ownerId;
        const newOwnerId = data.ownerId instanceof UniqueId 
          ? data.ownerId 
          : new UniqueId(data.ownerId);
        
        this.props.ownerId = newOwnerId;
        updatedFields.push('ownerId');
        
        // Skapa händelse för ägarbyte
        this.addDomainEvent(new ResourceOwnerChanged(
          this.id,
          this.organizationId,
          previousOwnerId,
          newOwnerId
        ));
      }

      if (data.metadata !== undefined) {
        this.props.metadata = { ...data.metadata };
        updatedFields.push('metadata');
      }

      if (data.permissionAssignments !== undefined) {
        this.props.permissionAssignments = [...data.permissionAssignments];
        updatedFields.push('permissionAssignments');
      }

      this.props.updatedAt = new Date();
      
      // Skapa domänhändelse för uppdatering
      if (updatedFields.length > 0) {
        this.addDomainEvent(new ResourceUpdated(
          this.id,
          this.organizationId,
          this.name,
          this.type,
          this.ownerId,
          updatedFields
        ));
      }

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera resurs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Metod för att markera en resurs som borttagen
  public markAsDeleted(): Result<void, string> {
    try {
      // Skapa domänhändelse för borttagning
      this.addDomainEvent(new ResourceDeleted(
        this.id,
        this.organizationId,
        this.name,
        this.type
      ));
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte markera resurs som borttagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Factory metod för att skapa en ny organisationsresurs
  public static create(data: OrganizationResourceCreateDTO): Result<OrganizationResource, string> {
    try {
      // Validera input
      if (!data.name || data.name.trim().length < 2) {
        return err('Resursnamn måste vara minst 2 tecken');
      }

      if (!data.type) {
        return err('Resurstyp måste anges');
      }

      if (!data.organizationId) {
        return err('OrganizationId måste anges');
      }

      if (!data.ownerId) {
        return err('OwnerId måste anges');
      }

      const id = new UniqueId();
      const organizationId = data.organizationId instanceof UniqueId 
        ? data.organizationId 
        : new UniqueId(data.organizationId);
      const ownerId = data.ownerId instanceof UniqueId 
        ? data.ownerId 
        : new UniqueId(data.ownerId);
      const now = new Date();

      const resource = new OrganizationResource({
        id,
        organizationId,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : undefined,
        type: data.type,
        ownerId,
        metadata: data.metadata || {},
        permissionAssignments: data.permissionAssignments || [],
        createdAt: now,
        updatedAt: now
      });

      // Lägg till domänhändelse för skapande
      resource.addDomainEvent(new ResourceCreated(
        id,
        organizationId,
        data.name.trim(),
        data.type,
        ownerId
      ));

      return ok(resource);
    } catch (error) {
      return err(`Kunde inte skapa resurs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 