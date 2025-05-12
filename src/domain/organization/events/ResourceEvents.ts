import { DomainEvent } from '@/shared/domain/events/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { ResourceType } from '../value-objects/ResourceType';

export class ResourceCreated implements DomainEvent {
  public readonly name = 'resource.created';
  public readonly occurredAt: Date;

  constructor(
    public readonly resourceId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly resourceName: string,
    public readonly resourceType: ResourceType,
    public readonly ownerId: UniqueId
  ) {
    this.occurredAt = new Date();
  }
}

export class ResourceUpdated implements DomainEvent {
  public readonly name = 'resource.updated';
  public readonly occurredAt: Date;

  constructor(
    public readonly resourceId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly resourceName: string,
    public readonly resourceType: ResourceType,
    public readonly ownerId: UniqueId,
    public readonly updatedFields: string[]
  ) {
    this.occurredAt = new Date();
  }
}

export class ResourceDeleted implements DomainEvent {
  public readonly name = 'resource.deleted';
  public readonly occurredAt: Date;

  constructor(
    public readonly resourceId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly resourceName: string,
    public readonly resourceType: ResourceType
  ) {
    this.occurredAt = new Date();
  }
}

export class ResourcePermissionAdded implements DomainEvent {
  public readonly name = 'resource.permission.added';
  public readonly occurredAt: Date;

  constructor(
    public readonly resourceId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly userId?: UniqueId,
    public readonly teamId?: UniqueId,
    public readonly role?: string,
    public readonly permissions: string[]
  ) {
    this.occurredAt = new Date();
  }
}

export class ResourcePermissionRemoved implements DomainEvent {
  public readonly name = 'resource.permission.removed';
  public readonly occurredAt: Date;

  constructor(
    public readonly resourceId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly userId?: UniqueId,
    public readonly teamId?: UniqueId,
    public readonly role?: string
  ) {
    this.occurredAt = new Date();
  }
}

export class ResourceOwnerChanged implements DomainEvent {
  public readonly name = 'resource.owner.changed';
  public readonly occurredAt: Date;

  constructor(
    public readonly resourceId: UniqueId,
    public readonly organizationId: UniqueId,
    public readonly previousOwnerId: UniqueId,
    public readonly newOwnerId: UniqueId
  ) {
    this.occurredAt = new Date();
  }
} 