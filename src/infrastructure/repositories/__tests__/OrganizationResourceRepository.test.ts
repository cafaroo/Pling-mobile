import { UniqueId } from '@/shared/core/UniqueId';
import { SupabaseOrganizationResourceRepository } from '@/infrastructure/repositories/organization/SupabaseOrganizationResourceRepository';
import { OrganizationResourceMapper } from '@/infrastructure/repositories/organization/OrganizationResourceMapper';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { ResourceType } from '@/domain/organization/value-objects/ResourceType';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { Result } from '@/shared/core/Result';
import { EventBus } from '@/shared/domain/events/EventBus';
import { DomainEvent } from '@/shared/domain/events/DomainEvent';

// Mock för Supabase-klienten
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  data: null,
  error: null
};

// Mock för EventBus
class MockEventBus implements EventBus {
  private events: DomainEvent[] = [];
  
  publish(event: DomainEvent): void {
    this.events.push(event);
  }
  
  getPublishedEvents(): DomainEvent[] {
    return [...this.events];
  }
  
  clearEvents(): void {
    this.events = [];
  }
}

describe('OrganizationResourceRepository', () => {
  let repository: SupabaseOrganizationResourceRepository;
  let eventBus: MockEventBus;
  
  // Testdata
  const organizationId = new UniqueId();
  const ownerId = new UniqueId();
  const resourceId = new UniqueId();
  const userId = new UniqueId();
  
  const resourceDTO = {
    id: resourceId.toString(),
    organization_id: organizationId.toString(),
    name: 'Test Resource',
    description: 'A test resource',
    type: ResourceType.DOCUMENT,
    owner_id: ownerId.toString(),
    metadata: { isPublic: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const permissionDTO = {
    id: new UniqueId().toString(),
    resource_id: resourceId.toString(),
    user_id: userId.toString(),
    permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Återställ mock-data
    mockSupabase.data = null;
    mockSupabase.error = null;
    
    // Skapa en ny EventBus för varje test
    eventBus = new MockEventBus();
    
    // Skapa repository med mockad Supabase-klient
    repository = new SupabaseOrganizationResourceRepository(
      mockSupabase as any,
      undefined, // cache
      eventBus,
      undefined // logger
    );
  });
  
  describe('findById', () => {
    test('ResourceRepository_Get_ShouldReturnStoredResource', async () => {
      // Konfigurera supabase-svar
      mockSupabase.data = [resourceDTO];
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const result = await repository.findById(resourceId);
      
      // Verifiera att anropet gjordes korrekt
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_resources');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', resourceId.toString());
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const resource = result.value;
        expect(resource).toBeInstanceOf(OrganizationResource);
        expect(resource.id.toString()).toBe(resourceId.toString());
        expect(resource.name).toBe(resourceDTO.name);
        expect(resource.type).toBe(resourceDTO.type);
      }
    });
    
    test('ResourceRepository_Get_ShouldHandleErrors', async () => {
      // Konfigurera supabase-svar för att simulera ett fel
      mockSupabase.data = null;
      mockSupabase.error = { message: 'Database error' };
      
      // Anropa repository-metod
      const result = await repository.findById(resourceId);
      
      // Verifiera att anropet gjordes
      expect(mockSupabase.from).toHaveBeenCalled();
      
      // Verifiera resultat
      expect(result.isErr()).toBe(true);
    });
  });
  
  describe('findByOrganizationId', () => {
    test('ResourceRepository_FindByOrganizationId_ShouldFilterCorrectly', async () => {
      // Konfigurera supabase-svar
      mockSupabase.data = [resourceDTO, { ...resourceDTO, id: new UniqueId().toString() }];
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const result = await repository.findByOrganizationId(organizationId);
      
      // Verifiera att anropet gjordes korrekt
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_resources');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', organizationId.toString());
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const resources = result.value;
        expect(Array.isArray(resources)).toBe(true);
        expect(resources.length).toBe(2);
        expect(resources[0]).toBeInstanceOf(OrganizationResource);
        expect(resources[0].organizationId.toString()).toBe(organizationId.toString());
      }
    });
  });
  
  describe('findByType', () => {
    test('ResourceRepository_FindByType_ShouldFilterCorrectly', async () => {
      // Konfigurera supabase-svar
      mockSupabase.data = [resourceDTO];
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const result = await repository.findByType(organizationId, ResourceType.DOCUMENT);
      
      // Verifiera att anropet gjordes korrekt
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_resources');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', organizationId.toString());
      expect(mockSupabase.eq).toHaveBeenCalledWith('type', ResourceType.DOCUMENT);
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const resources = result.value;
        expect(Array.isArray(resources)).toBe(true);
        expect(resources[0]).toBeInstanceOf(OrganizationResource);
        expect(resources[0].type).toBe(ResourceType.DOCUMENT);
      }
    });
  });
  
  describe('save', () => {
    test('ResourceRepository_Save_ShouldStoreResource', async () => {
      // Skapa en resurs att spara
      const createResult = OrganizationResource.create({
        name: 'New Resource',
        description: 'A new resource',
        type: ResourceType.DOCUMENT,
        organizationId: organizationId,
        ownerId: ownerId,
        metadata: { isPublic: true }
      });
      
      expect(createResult.isOk()).toBe(true);
      if (!createResult.isOk()) return;
      
      const resource = createResult.value;
      
      // Konfigurera supabase-svar
      mockSupabase.data = { id: resource.id.toString() };
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const result = await repository.save(resource);
      
      // Verifiera att anropet gjordes korrekt
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_resources');
      expect(mockSupabase.insert).toHaveBeenCalled();
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      
      // Verifiera att händelser publicerades
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBeGreaterThan(0);
      expect(publishedEvents[0].name).toBe('resource.created');
    });
  });
  
  describe('delete', () => {
    test('ResourceRepository_Delete_ShouldRemoveResource', async () => {
      // Konfigurera supabase-svar för första anropet (findById)
      mockSupabase.data = [resourceDTO];
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const result = await repository.delete(resourceId);
      
      // Verifiera att anropet gjordes korrekt
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_resources');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', resourceId.toString());
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      
      // Verifiera att händelser publicerades
      const publishedEvents = eventBus.getPublishedEvents();
      expect(publishedEvents.length).toBeGreaterThan(0);
      expect(publishedEvents[0].name).toBe('resource.deleted');
    });
  });
  
  describe('exists', () => {
    test('ResourceRepository_Exists_ShouldReturnTrueForExistingResource', async () => {
      // Konfigurera supabase-svar
      mockSupabase.data = [{ exists: true }];
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const exists = await repository.exists(resourceId);
      
      // Verifiera att anropet gjordes korrekt
      expect(mockSupabase.from).toHaveBeenCalled();
      
      // Verifiera resultat
      expect(exists).toBe(true);
    });
    
    test('ResourceRepository_Exists_ShouldReturnFalseForNonExistingResource', async () => {
      // Konfigurera supabase-svar
      mockSupabase.data = [];
      mockSupabase.error = null;
      
      // Anropa repository-metod
      const exists = await repository.exists(new UniqueId());
      
      // Verifiera resultat
      expect(exists).toBe(false);
    });
  });
}); 