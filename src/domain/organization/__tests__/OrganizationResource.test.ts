import { OrganizationResource } from '../entities/OrganizationResource';
import { ResourceType } from '../value-objects/ResourceType';
import { ResourcePermission } from '../value-objects/ResourcePermission';
import { UniqueId } from '@/shared/core/UniqueId';
import { ResourceCreated, ResourceOwnerChanged, ResourceUpdated } from '../events/ResourceEvents';

describe('OrganizationResource', () => {
  // Testdata
  const organizationId = new UniqueId();
  const ownerId = new UniqueId();
  const userId = new UniqueId();
  const teamId = new UniqueId();

  const validResourceData = {
    name: 'Testresurs',
    description: 'En testresurs för enhetstest',
    type: ResourceType.DOCUMENT,
    organizationId: organizationId,
    ownerId: ownerId,
    metadata: { isPublic: true },
  };

  test('OrganizationResource_Create_ShouldValidateInput', () => {
    // Giltiga data ska skapa en resurs
    const result = OrganizationResource.create(validResourceData);
    expect(result.isOk()).toBe(true);
    
    // För kort namn ska ge fel
    const shortNameResult = OrganizationResource.create({
      ...validResourceData,
      name: 'A' // För kort
    });
    expect(shortNameResult.isErr()).toBe(true);
    
    // Tomt namn ska ge fel
    const emptyNameResult = OrganizationResource.create({
      ...validResourceData,
      name: '' 
    });
    expect(emptyNameResult.isErr()).toBe(true);
    
    // Null-värden ska ge fel
    const nullTypeResult = OrganizationResource.create({
      ...validResourceData,
      type: null as any
    });
    expect(nullTypeResult.isErr()).toBe(true);
  });

  test('OrganizationResource_Create_ShouldGenerateEvents', () => {
    // När en ny resurs skapas ska en ResourceCreated-händelse skapas
    const result = OrganizationResource.create(validResourceData);
    expect(result.isOk()).toBe(true);
    
    const resource = result.value;
    expect(resource.domainEvents.length).toBe(1);
    
    const event = resource.domainEvents[0];
    expect(event).toBeInstanceOf(ResourceCreated);
    
    const createdEvent = event as ResourceCreated;
    expect(createdEvent.resourceId).toEqual(resource.id);
    expect(createdEvent.organizationId).toEqual(organizationId);
    expect(createdEvent.resourceName).toBe(validResourceData.name);
    expect(createdEvent.resourceType).toBe(validResourceData.type);
    expect(createdEvent.ownerId).toEqual(ownerId);
  });

  test('OrganizationResource_Update_ShouldTrackChangedFields', () => {
    // Skapa en resurs
    const createResult = OrganizationResource.create(validResourceData);
    expect(createResult.isOk()).toBe(true);
    const resource = createResult.value;
    
    // Rensa tidigare händelser (från skapandet)
    resource.clearEvents();
    
    // Uppdatera flera fält
    const updateResult = resource.update({
      name: 'Uppdaterad namn',
      description: 'Uppdaterad beskrivning',
      metadata: { isPublic: false, version: 2 }
    });
    
    expect(updateResult.isOk()).toBe(true);
    expect(resource.domainEvents.length).toBe(1);
    
    const event = resource.domainEvents[0] as ResourceUpdated;
    expect(event).toBeInstanceOf(ResourceUpdated);
    expect(event.updatedFields).toContain('name');
    expect(event.updatedFields).toContain('description');
    expect(event.updatedFields).toContain('metadata');
    expect(event.updatedFields.length).toBe(3);
    
    // Verifiera att fälten faktiskt uppdaterades
    expect(resource.name).toBe('Uppdaterad namn');
    expect(resource.description).toBe('Uppdaterad beskrivning');
    expect(resource.metadata.isPublic).toBe(false);
    expect(resource.metadata.version).toBe(2);
  });

  test('OrganizationResource_ChangeOwner_ShouldCreateOwnerChangedEvent', () => {
    // Skapa en resurs
    const createResult = OrganizationResource.create(validResourceData);
    expect(createResult.isOk()).toBe(true);
    const resource = createResult.value;
    
    // Rensa tidigare händelser (från skapandet)
    resource.clearEvents();
    
    // Ny ägare
    const newOwnerId = new UniqueId();
    
    // Uppdatera ägare
    const updateResult = resource.update({
      ownerId: newOwnerId
    });
    
    expect(updateResult.isOk()).toBe(true);
    expect(resource.domainEvents.length).toBe(2); // En för update och en för owner changed
    
    // Hitta ResourceOwnerChanged-händelsen
    const ownerChangedEvent = resource.domainEvents.find(
      event => event instanceof ResourceOwnerChanged
    ) as ResourceOwnerChanged;
    
    expect(ownerChangedEvent).toBeDefined();
    expect(ownerChangedEvent.previousOwnerId).toEqual(ownerId);
    expect(ownerChangedEvent.newOwnerId).toEqual(newOwnerId);
    
    // Verifiera att ägaren faktiskt uppdaterades
    expect(resource.ownerId).toEqual(newOwnerId);
  });

  test('OrganizationResource_AddPermission_ShouldValidateInput', () => {
    // Skapa en resurs
    const createResult = OrganizationResource.create(validResourceData);
    expect(createResult.isOk()).toBe(true);
    const resource = createResult.value;
    
    // Lägg till användarrättighet
    const addUserPermission = resource.addPermission({
      userId: userId,
      permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT]
    });
    expect(addUserPermission.isOk()).toBe(true);
    
    // Lägg till teamrättighet
    const addTeamPermission = resource.addPermission({
      teamId: teamId,
      permissions: [ResourcePermission.VIEW]
    });
    expect(addTeamPermission.isOk()).toBe(true);
    
    // Lägg till rollrättighet
    const addRolePermission = resource.addPermission({
      role: 'member',
      permissions: [ResourcePermission.VIEW]
    });
    expect(addRolePermission.isOk()).toBe(true);
    
    // Måste ange antingen user, team eller roll
    const invalidPermission = resource.addPermission({
      permissions: [ResourcePermission.VIEW]
    });
    expect(invalidPermission.isErr()).toBe(true);
    
    // Måste ange minst en behörighet
    const emptyPermission = resource.addPermission({
      userId: userId,
      permissions: []
    });
    expect(emptyPermission.isErr()).toBe(true);
  });

  test('OrganizationResource_AddPermission_ShouldNotAllowDuplicates', () => {
    // Skapa en resurs
    const createResult = OrganizationResource.create(validResourceData);
    expect(createResult.isOk()).toBe(true);
    const resource = createResult.value;
    
    // Lägg till användarrättighet
    const addPermission1 = resource.addPermission({
      userId: userId,
      permissions: [ResourcePermission.VIEW]
    });
    expect(addPermission1.isOk()).toBe(true);
    
    // Försök lägga till samma användarbehörighetsuppsättning igen
    const addPermission2 = resource.addPermission({
      userId: userId,
      permissions: [ResourcePermission.VIEW]
    });
    expect(addPermission2.isErr()).toBe(true);
    
    // Men det bör gå att uppdatera rättigheter
    const updatePermission = resource.addPermission({
      userId: userId,
      permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT]
    });
    expect(updatePermission.isOk()).toBe(true);
    
    // Kontrollera att behörigheterna faktiskt uppdaterades
    const userPermissions = resource.permissionAssignments.find(
      p => p.userId && p.userId.equals(userId)
    );
    expect(userPermissions).toBeDefined();
    expect(userPermissions?.permissions).toContain(ResourcePermission.VIEW);
    expect(userPermissions?.permissions).toContain(ResourcePermission.EDIT);
    expect(userPermissions?.permissions.length).toBe(2);
  });

  test('OrganizationResource_RemovePermission_ShouldWork', () => {
    // Skapa en resurs
    const createResult = OrganizationResource.create(validResourceData);
    expect(createResult.isOk()).toBe(true);
    const resource = createResult.value;
    
    // Lägg till rättigheter att ta bort
    resource.addPermission({
      userId: userId,
      permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT]
    });
    
    resource.addPermission({
      teamId: teamId,
      permissions: [ResourcePermission.VIEW]
    });
    
    resource.addPermission({
      role: 'member',
      permissions: [ResourcePermission.VIEW]
    });
    
    // Ta bort användarrättighet
    const removeUserPermission = resource.removePermission(userId);
    expect(removeUserPermission.isOk()).toBe(true);
    
    const remainingUserPermission = resource.permissionAssignments.find(
      p => p.userId && p.userId.equals(userId)
    );
    expect(remainingUserPermission).toBeUndefined();
    
    // Ta bort teamrättighet
    const removeTeamPermission = resource.removePermission(undefined, teamId);
    expect(removeTeamPermission.isOk()).toBe(true);
    
    const remainingTeamPermission = resource.permissionAssignments.find(
      p => p.teamId && p.teamId.equals(teamId)
    );
    expect(remainingTeamPermission).toBeUndefined();
    
    // Ta bort rollrättighet
    const removeRolePermission = resource.removePermission(undefined, undefined, 'member');
    expect(removeRolePermission.isOk()).toBe(true);
    
    const remainingRolePermission = resource.permissionAssignments.find(
      p => p.role === 'member'
    );
    expect(remainingRolePermission).toBeUndefined();
    
    // Det ska misslyckas om inga behörigheter finns att ta bort
    const nonExistingPermission = resource.removePermission(new UniqueId());
    expect(nonExistingPermission.isErr()).toBe(true);
  });
}); 