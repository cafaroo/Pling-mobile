import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationResourceRepository } from '@/domain/organization/repositories/OrganizationResourceRepository';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { ResourceType } from '@/domain/organization/value-objects/ResourceType';
import { OrganizationResourceMapper, OrganizationResourceDTO, ResourcePermissionDTO } from './OrganizationResourceMapper';
import { Cache } from '@/infrastructure/cache/Cache';
import { Logger } from '@/infrastructure/logging/Logger';
import { PerformanceMonitor } from '@/infrastructure/monitoring/PerformanceMonitor';
import { EventBus } from '@/infrastructure/events/EventBus';

export class SupabaseOrganizationResourceRepository implements OrganizationResourceRepository {
  private readonly cacheKeyPrefix = 'organization_resource:';
  private readonly orgResourcesListKeyPrefix = 'organization_resources_list:';
  private readonly orgResourcesByTypeKeyPrefix = 'organization_resources_by_type:';
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minuter
  private readonly batchSize = 50; // Batchstorlek för stora datamängder

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly cache?: Cache,
    private readonly logger?: Logger,
    private readonly performanceMonitor?: PerformanceMonitor,
    private readonly eventBus?: EventBus
  ) {}

  async findById(id: UniqueId): Promise<Result<OrganizationResource>> {
    try {
      // Kontrollera cache först
      const cacheKey = `${this.cacheKeyPrefix}${id.toString()}`;
      if (this.cache) {
        const cachedResource = await this.cache.get<OrganizationResource>(cacheKey);
        if (cachedResource) {
          return Result.ok(cachedResource);
        }
      }

      const { data, error } = await this.supabase
        .from('organization_resources')
        .select('*, organization_resource_permissions(*)')
        .eq('id', id.toString())
        .single();

      if (error) {
        this.logger?.error('Error fetching resource', { id: id.toString(), error });
        return Result.fail(`Failed to fetch resource: ${error.message}`);
      }

      if (!data) {
        return Result.fail('Resource not found');
      }

      const resource = OrganizationResourceMapper.toDomain(data);
      
      // Spara i cache
      if (this.cache) {
        await this.cache.set(cacheKey, resource, this.cacheTTL);
      }
      
      return Result.ok(resource);
    } catch (error) {
      this.logger?.error('Unexpected error fetching resource', { id: id.toString(), error });
      return Result.fail(`Unexpected error: ${error.message}`);
    }
  }

  async findByOrganizationId(organizationId: UniqueId): Promise<Result<OrganizationResource[]>> {
    try {
      const orgId = organizationId.toString();
      
      // Kontrollera cache först
      const cacheKey = `${this.orgResourcesListKeyPrefix}${orgId}`;
      if (this.cache) {
        const cachedResources = await this.cache.get<OrganizationResource[]>(cacheKey);
        if (cachedResources) {
          return Result.ok(cachedResources);
        }
      }

      // Hämta antal resurser för att avgöra om vi behöver batching
      const countResult = await this.supabase
        .from('organization_resources')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      
      const totalCount = countResult.count || 0;
      
      // Använd batching om antalet resurser överstiger batchstorleken
      if (totalCount > this.batchSize) {
        return this.findByOrganizationIdBatched(organizationId, totalCount);
      }

      // För mindre datamängder, hämta allt på en gång
      const { data, error } = await this.supabase
        .from('organization_resources')
        .select('*, organization_resource_permissions(*)')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false });

      if (error) {
        this.logger?.error('Error fetching resources by organization', { organizationId: orgId, error });
        return Result.fail(`Failed to fetch resources: ${error.message}`);
      }

      const resources = data.map(OrganizationResourceMapper.toDomain);
      
      // Spara i cache
      if (this.cache) {
        await this.cache.set(cacheKey, resources, this.cacheTTL);
        
        // Spara även individuella resurser i cache
        for (const resource of resources) {
          const resourceCacheKey = `${this.cacheKeyPrefix}${resource.id.toString()}`;
          await this.cache.set(resourceCacheKey, resource, this.cacheTTL);
        }
      }
      
      return Result.ok(resources);
    } catch (error) {
      this.logger?.error('Unexpected error fetching resources by organization', { 
        organizationId: organizationId.toString(), 
        error 
      });
      return Result.fail(`Unexpected error: ${error.message}`);
    }
  }

  private async findByOrganizationIdBatched(
    organizationId: UniqueId, 
    totalCount: number
  ): Promise<Result<OrganizationResource[]>> {
    try {
      const orgId = organizationId.toString();
      const batches = Math.ceil(totalCount / this.batchSize);
      const resources: OrganizationResource[] = [];
      
      for (let i = 0; i < batches; i++) {
        const { data, error } = await this.supabase
          .from('organization_resources')
          .select('*, organization_resource_permissions(*)')
          .eq('organization_id', orgId)
          .order('updated_at', { ascending: false })
          .range(i * this.batchSize, (i + 1) * this.batchSize - 1);
          
        if (error) {
          this.logger?.error('Error fetching resources batch', { 
            organizationId: orgId, 
            batch: i,
            error 
          });
          return Result.fail(`Failed to fetch resources batch: ${error.message}`);
        }
        
        const batchResources = data.map(OrganizationResourceMapper.toDomain);
        resources.push(...batchResources);
        
        // Spara individuella resurser i cache
        if (this.cache) {
          for (const resource of batchResources) {
            const resourceCacheKey = `${this.cacheKeyPrefix}${resource.id.toString()}`;
            await this.cache.set(resourceCacheKey, resource, this.cacheTTL);
          }
        }
      }
      
      // Spara hela listan i cache
      if (this.cache) {
        const cacheKey = `${this.orgResourcesListKeyPrefix}${orgId}`;
        await this.cache.set(cacheKey, resources, this.cacheTTL);
      }
      
      return Result.ok(resources);
    } catch (error) {
      this.logger?.error('Unexpected error fetching resources in batches', { 
        organizationId: organizationId.toString(), 
        error 
      });
      return Result.fail(`Unexpected error in batch loading: ${error.message}`);
    }
  }

  async findByType(
    organizationId: UniqueId, 
    resourceType: ResourceType
  ): Promise<Result<OrganizationResource[]>> {
    try {
      const orgId = organizationId.toString();
      
      // Kontrollera cache först
      const cacheKey = `${this.orgResourcesByTypeKeyPrefix}${orgId}:${resourceType}`;
      if (this.cache) {
        const cachedResources = await this.cache.get<OrganizationResource[]>(cacheKey);
        if (cachedResources) {
          return Result.ok(cachedResources);
        }
      }

      const { data, error } = await this.supabase
        .from('organization_resources')
        .select('*, organization_resource_permissions(*)')
        .eq('organization_id', orgId)
        .eq('type', resourceType)
        .order('updated_at', { ascending: false });

      if (error) {
        this.logger?.error('Error fetching resources by type', { 
          organizationId: orgId, 
          resourceType,
          error 
        });
        return Result.fail(`Failed to fetch resources by type: ${error.message}`);
      }

      const resources = data.map(OrganizationResourceMapper.toDomain);
      
      // Spara i cache
      if (this.cache) {
        await this.cache.set(cacheKey, resources, this.cacheTTL);
        
        // Spara även individuella resurser i cache
        for (const resource of resources) {
          const resourceCacheKey = `${this.cacheKeyPrefix}${resource.id.toString()}`;
          await this.cache.set(resourceCacheKey, resource, this.cacheTTL);
        }
      }
      
      return Result.ok(resources);
    } catch (error) {
      this.logger?.error('Unexpected error fetching resources by type', { 
        organizationId: organizationId.toString(),
        resourceType, 
        error 
      });
      return Result.fail(`Unexpected error: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId: UniqueId): Promise<Result<OrganizationResource[], string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'findResourcesByOwnerId');

      // Hämta alla resurser som ägs av användaren
      const { data: resourcesData, error: resourcesError } = await this.supabase
        .from('organization_resources')
        .select('*')
        .eq('owner_id', ownerId.toString());

      if (resourcesError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hämta resurser: ${resourcesError.message}`);
      }

      if (!resourcesData || resourcesData.length === 0) {
        this.performanceMonitor?.endOperation(operationId, true);
        return ok([]);
      }

      // Hämta behörigheter för alla resurser
      const resourceIds = resourcesData.map(r => r.id);
      const { data: permissionsData, error: permissionsError } = await this.supabase
        .from('resource_permissions')
        .select('*')
        .in('resource_id', resourceIds);

      if (permissionsError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hämta resursbehörigheter: ${permissionsError.message}`);
      }

      this.performanceMonitor?.endOperation(operationId, true);

      // Samma logik som i findByOrganizationId
      const permissionsByResourceId: Record<string, ResourcePermissionDTO[]> = {};
      if (permissionsData) {
        permissionsData.forEach(permission => {
          if (!permissionsByResourceId[permission.resource_id]) {
            permissionsByResourceId[permission.resource_id] = [];
          }
          permissionsByResourceId[permission.resource_id].push(permission as ResourcePermissionDTO);
        });
      }

      const resources: OrganizationResource[] = [];
      for (const resourceData of resourcesData) {
        const resourceDTO = resourceData as OrganizationResourceDTO;
        const permissionsDTO = permissionsByResourceId[resourceData.id] || [];
        
        const resource = OrganizationResourceMapper.toDomain(resourceDTO, permissionsDTO);
        resources.push(resource);
        
        if (this.cache) {
          await this.cache.set(`${this.cacheKeyPrefix}:${resource.id.toString()}`, resource, 60 * 5);
        }
      }

      return ok(resources);
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av resurser: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av resurser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAccessibleByUserId(organizationId: UniqueId, userId: UniqueId): Promise<Result<OrganizationResource[], string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'findResourcesAccessibleByUserId');

      // Hämta alla resurser i organisationen
      const { data: resourcesData, error: resourcesError } = await this.supabase
        .from('organization_resources')
        .select('*')
        .eq('organization_id', organizationId.toString());

      if (resourcesError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hämta resurser: ${resourcesError.message}`);
      }

      if (!resourcesData || resourcesData.length === 0) {
        this.performanceMonitor?.endOperation(operationId, true);
        return ok([]);
      }

      // Hämta alla behörigheter för resurser
      const resourceIds = resourcesData.map(r => r.id);
      
      const { data: permissionsData, error: permissionsError } = await this.supabase
        .from('resource_permissions')
        .select('*')
        .in('resource_id', resourceIds);

      if (permissionsError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hämta resursbehörigheter: ${permissionsError.message}`);
      }

      // Hämta användarens team-medlemskap för team-behörigheter
      const { data: teamMembershipsData, error: teamMembershipsError } = await this.supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId.toString());

      if (teamMembershipsError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hämta teammedlemskap: ${teamMembershipsError.message}`);
      }

      // Hämta användarens organisationsroll
      const { data: orgMemberData, error: orgMemberError } = await this.supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId.toString())
        .eq('user_id', userId.toString())
        .maybeSingle();

      if (orgMemberError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hämta organisationsmedlemskap: ${orgMemberError.message}`);
      }

      this.performanceMonitor?.endOperation(operationId, true);

      // Gruppera behörigheterna per resurs
      const permissionsByResourceId: Record<string, ResourcePermissionDTO[]> = {};
      if (permissionsData) {
        permissionsData.forEach(permission => {
          if (!permissionsByResourceId[permission.resource_id]) {
            permissionsByResourceId[permission.resource_id] = [];
          }
          permissionsByResourceId[permission.resource_id].push(permission as ResourcePermissionDTO);
        });
      }

      // Sätt användarens teamIds för behörighetskontroll
      const userTeamIds = teamMembershipsData?.map(tm => tm.team_id) || [];
      const userOrgRole = orgMemberData?.role;

      // Filtrera resurser baserat på behörigheter
      const accessibleResources: OrganizationResource[] = [];
      for (const resourceData of resourcesData) {
        // Användaren äger resursen
        if (resourceData.owner_id === userId.toString()) {
          const resource = OrganizationResourceMapper.toDomain(
            resourceData as OrganizationResourceDTO,
            permissionsByResourceId[resourceData.id] || []
          );
          accessibleResources.push(resource);
          continue;
        }

        // Kontrollera direkta användarbehörigheter
        const resourcePermissions = permissionsByResourceId[resourceData.id] || [];
        const hasUserPermission = resourcePermissions.some(p => 
          p.user_id === userId.toString() && 
          (p.permissions as string[]).includes('view')
        );
        
        if (hasUserPermission) {
          const resource = OrganizationResourceMapper.toDomain(
            resourceData as OrganizationResourceDTO,
            permissionsByResourceId[resourceData.id] || []
          );
          accessibleResources.push(resource);
          continue;
        }

        // Kontrollera team-behörigheter
        const hasTeamPermission = resourcePermissions.some(p =>
          p.team_id && 
          userTeamIds.includes(p.team_id) && 
          (p.permissions as string[]).includes('view')
        );

        if (hasTeamPermission) {
          const resource = OrganizationResourceMapper.toDomain(
            resourceData as OrganizationResourceDTO,
            permissionsByResourceId[resourceData.id] || []
          );
          accessibleResources.push(resource);
          continue;
        }

        // Kontrollera rollbaserade behörigheter
        if (userOrgRole) {
          const hasRolePermission = resourcePermissions.some(p =>
            p.role === userOrgRole && 
            (p.permissions as string[]).includes('view')
          );

          if (hasRolePermission) {
            const resource = OrganizationResourceMapper.toDomain(
              resourceData as OrganizationResourceDTO,
              permissionsByResourceId[resourceData.id] || []
            );
            accessibleResources.push(resource);
          }
        }
      }

      // Uppdatera cache för alla hämtade resurser
      if (this.cache) {
        for (const resource of accessibleResources) {
          await this.cache.set(`${this.cacheKeyPrefix}:${resource.id.toString()}`, resource, 60 * 5);
        }
      }

      return ok(accessibleResources);
    } catch (error) {
      this.logger?.error(`Fel vid hämtning av tillgängliga resurser: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid hämtning av tillgängliga resurser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async save(resource: OrganizationResource): Promise<Result<void, string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'saveOrganizationResource');

      // Konvertera domänmodell till DTOs
      const { resource: resourceDTO, permissions: permissionsDTO } = OrganizationResourceMapper.toDTO(resource);
      
      // Starta en transaktion med samma tidsstämpel
      const now = new Date().toISOString();
      
      // Spara eller uppdatera resursen
      const { data: resourceData, error: resourceError } = await this.supabase
        .from('organization_resources')
        .upsert({
          ...resourceDTO,
          updated_at: now
        });

      if (resourceError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte spara resurs: ${resourceError.message}`);
      }

      // Ta bort alla befintliga behörigheter för resursen
      const { error: deletePermissionsError } = await this.supabase
        .from('resource_permissions')
        .delete()
        .eq('resource_id', resource.id.toString());

      if (deletePermissionsError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte ta bort befintliga behörigheter: ${deletePermissionsError.message}`);
      }

      // Lägg till nya behörigheter om det finns några
      if (permissionsDTO.length > 0) {
        const { error: insertPermissionsError } = await this.supabase
          .from('resource_permissions')
          .insert(permissionsDTO.map(p => ({
            ...p,
            created_at: now,
            updated_at: now
          })));

        if (insertPermissionsError) {
          this.performanceMonitor?.endOperation(operationId, false);
          return err(`Kunde inte lägga till nya behörigheter: ${insertPermissionsError.message}`);
        }
      }

      this.performanceMonitor?.endOperation(operationId, true);

      // Rensa cache för denna resurs
      if (this.cache) {
        await this.cache.remove(`${this.cacheKeyPrefix}:${resource.id.toString()}`);
      }

      // Publicera eventuella domänhändelser
      if (this.eventBus) {
        resource.domainEvents.forEach(event => {
          this.eventBus?.publish(event);
        });
        resource.clearEvents();
      }

      return ok(undefined);
    } catch (error) {
      this.logger?.error(`Fel vid sparande av resurs: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid sparande av resurs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(id: UniqueId): Promise<Result<void, string>> {
    try {
      const operationId = this.performanceMonitor?.startOperation('database', 'deleteOrganizationResource');

      // Hämta resursen först för att kunna generera domänhändelser
      const resourceResult = await this.findById(id);
      if (resourceResult.isErr()) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte hitta resursen för borttagning: ${resourceResult.error}`);
      }

      // Markera resursen som borttagen (genererar domänhändelsen)
      const resource = resourceResult.value;
      resource.markAsDeleted();

      // Ta bort resursen (kommer kaskadradera behörigheter pga. foreign key constraints)
      const { error: deleteError } = await this.supabase
        .from('organization_resources')
        .delete()
        .eq('id', id.toString());

      if (deleteError) {
        this.performanceMonitor?.endOperation(operationId, false);
        return err(`Kunde inte ta bort resurs: ${deleteError.message}`);
      }

      this.performanceMonitor?.endOperation(operationId, true);

      // Rensa cache för denna resurs
      if (this.cache) {
        await this.cache.remove(`${this.cacheKeyPrefix}:${id.toString()}`);
      }

      // Publicera domänhändelser
      if (this.eventBus) {
        resource.domainEvents.forEach(event => {
          this.eventBus?.publish(event);
        });
        resource.clearEvents();
      }

      return ok(undefined);
    } catch (error) {
      this.logger?.error(`Fel vid borttagning av resurs: ${error instanceof Error ? error.message : String(error)}`);
      return err(`Fel vid borttagning av resurs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(id: UniqueId): Promise<boolean> {
    try {
      // Kontrollera cache först
      if (this.cache) {
        const cachedResource = await this.cache.get<OrganizationResource>(`${this.cacheKeyPrefix}:${id.toString()}`);
        if (cachedResource) {
          return true;
        }
      }

      const operationId = this.performanceMonitor?.startOperation('database', 'organizationResourceExists');

      // Kontrollera om resursen finns
      const { data, error } = await this.supabase
        .from('organization_resources')
        .select('id')
        .eq('id', id.toString())
        .single();

      this.performanceMonitor?.endOperation(operationId, !error);

      if (error && error.code !== 'PGRST116') { // PGRST116 = Ingen post hittades
        this.logger?.error(`Fel vid kontroll om resurs existerar: ${error.message}`);
        return false;
      }

      return !!data;
    } catch (error) {
      this.logger?.error(`Fel vid kontroll om resurs existerar: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
} 