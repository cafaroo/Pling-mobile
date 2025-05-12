import { 
  ResourceCreated, 
  ResourceDeleted, 
  ResourceUpdated, 
  ResourceOwnerChanged,
  ResourcePermissionAdded,
  ResourcePermissionRemoved
} from '../events/ResourceEvents';
import { ResourceType } from '../value-objects/ResourceType';
import { ResourcePermission } from '../value-objects/ResourcePermission';
import { UniqueId } from '@/shared/core/UniqueId';

describe('ResourceEvents', () => {
  // Testdata
  const resourceId = new UniqueId();
  const organizationId = new UniqueId();
  const ownerId = new UniqueId();
  const newOwnerId = new UniqueId();
  const userId = new UniqueId();
  const teamId = new UniqueId();

  test('ResourceCreated_Event_ShouldHaveCorrectData', () => {
    const resourceName = 'Testresurs';
    const resourceType = ResourceType.DOCUMENT;
    
    const event = new ResourceCreated(
      resourceId,
      organizationId,
      resourceName,
      resourceType,
      ownerId
    );
    
    expect(event.name).toBe('resource.created');
    expect(event.resourceId).toEqual(resourceId);
    expect(event.organizationId).toEqual(organizationId);
    expect(event.resourceName).toBe(resourceName);
    expect(event.resourceType).toBe(resourceType);
    expect(event.ownerId).toEqual(ownerId);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  test('ResourceUpdated_Event_ShouldHaveCorrectData', () => {
    const resourceName = 'Uppdaterad resurs';
    const resourceType = ResourceType.DOCUMENT;
    const updatedFields = ['name', 'description', 'metadata'];
    
    const event = new ResourceUpdated(
      resourceId,
      organizationId,
      resourceName,
      resourceType,
      ownerId,
      updatedFields
    );
    
    expect(event.name).toBe('resource.updated');
    expect(event.resourceId).toEqual(resourceId);
    expect(event.organizationId).toEqual(organizationId);
    expect(event.resourceName).toBe(resourceName);
    expect(event.resourceType).toBe(resourceType);
    expect(event.ownerId).toEqual(ownerId);
    expect(event.updatedFields).toEqual(updatedFields);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  test('ResourceDeleted_Event_ShouldHaveCorrectData', () => {
    const resourceName = 'Borttagen resurs';
    const resourceType = ResourceType.DOCUMENT;
    
    const event = new ResourceDeleted(
      resourceId,
      organizationId,
      resourceName,
      resourceType
    );
    
    expect(event.name).toBe('resource.deleted');
    expect(event.resourceId).toEqual(resourceId);
    expect(event.organizationId).toEqual(organizationId);
    expect(event.resourceName).toBe(resourceName);
    expect(event.resourceType).toBe(resourceType);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  test('ResourceOwnerChanged_Event_ShouldHaveCorrectData', () => {
    const event = new ResourceOwnerChanged(
      resourceId,
      organizationId,
      ownerId,
      newOwnerId
    );
    
    expect(event.name).toBe('resource.owner.changed');
    expect(event.resourceId).toEqual(resourceId);
    expect(event.organizationId).toEqual(organizationId);
    expect(event.previousOwnerId).toEqual(ownerId);
    expect(event.newOwnerId).toEqual(newOwnerId);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  test('ResourcePermissionAdded_Event_ShouldHaveCorrectData', () => {
    const permissions = [ResourcePermission.VIEW, ResourcePermission.EDIT];
    
    // Test användarrättighet
    const userEvent = new ResourcePermissionAdded(
      resourceId,
      organizationId,
      permissions,
      userId,
      undefined,
      undefined
    );
    
    expect(userEvent.name).toBe('resource.permission.added');
    expect(userEvent.resourceId).toEqual(resourceId);
    expect(userEvent.organizationId).toEqual(organizationId);
    expect(userEvent.permissions).toEqual(permissions);
    expect(userEvent.userId).toEqual(userId);
    expect(userEvent.teamId).toBeUndefined();
    expect(userEvent.role).toBeUndefined();
    expect(userEvent.occurredAt).toBeInstanceOf(Date);
    
    // Test teamrättighet
    const teamEvent = new ResourcePermissionAdded(
      resourceId,
      organizationId,
      permissions,
      undefined,
      teamId,
      undefined
    );
    
    expect(teamEvent.name).toBe('resource.permission.added');
    expect(teamEvent.teamId).toEqual(teamId);
    
    // Test rollrättighet
    const roleEvent = new ResourcePermissionAdded(
      resourceId,
      organizationId,
      permissions,
      undefined,
      undefined,
      'member'
    );
    
    expect(roleEvent.name).toBe('resource.permission.added');
    expect(roleEvent.role).toBe('member');
  });

  test('ResourcePermissionRemoved_Event_ShouldHaveCorrectData', () => {
    // Test användarrättighet
    const userEvent = new ResourcePermissionRemoved(
      resourceId,
      organizationId,
      userId,
      undefined,
      undefined
    );
    
    expect(userEvent.name).toBe('resource.permission.removed');
    expect(userEvent.resourceId).toEqual(resourceId);
    expect(userEvent.organizationId).toEqual(organizationId);
    expect(userEvent.userId).toEqual(userId);
    expect(userEvent.teamId).toBeUndefined();
    expect(userEvent.role).toBeUndefined();
    expect(userEvent.occurredAt).toBeInstanceOf(Date);
    
    // Test teamrättighet
    const teamEvent = new ResourcePermissionRemoved(
      resourceId,
      organizationId,
      undefined,
      teamId,
      undefined
    );
    
    expect(teamEvent.name).toBe('resource.permission.removed');
    expect(teamEvent.teamId).toEqual(teamId);
    
    // Test rollrättighet
    const roleEvent = new ResourcePermissionRemoved(
      resourceId,
      organizationId,
      undefined,
      undefined,
      'member'
    );
    
    expect(roleEvent.name).toBe('resource.permission.removed');
    expect(roleEvent.role).toBe('member');
  });
}); 