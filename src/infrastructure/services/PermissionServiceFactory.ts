import { PermissionService } from '@/domain/core/services/PermissionService';
import { DefaultPermissionService } from './DefaultPermissionService';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationResourceRepository } from '@/domain/organization/repositories/OrganizationResourceRepository';

/**
 * Factory för att skapa en PermissionService-instans
 * 
 * Denna factory gör det enkelt att skapa en PermissionService med rätt beroenden
 * och kan enkelt bytas ut i testmiljö.
 */
export class PermissionServiceFactory {
  /**
   * Skapar en ny instans av PermissionService
   * 
   * @param organizationRepository Repository för organisationer
   * @param teamRepository Repository för team
   * @param resourceRepository Repository för resurser
   * @returns En instans av PermissionService
   */
  static create(
    organizationRepository: OrganizationRepository,
    teamRepository: TeamRepository,
    resourceRepository: OrganizationResourceRepository
  ): PermissionService {
    return new DefaultPermissionService(
      organizationRepository,
      teamRepository,
      resourceRepository
    );
  }
  
  /**
   * Skapar en ny instans av PermissionService med standardberoenden
   * 
   * Denna metod är användbar när man vill ha en PermissionService med standardberoenden
   * utan att behöva skapa alla repositories manuellt.
   * 
   * @returns En instans av PermissionService
   */
  static createWithDefaults(): PermissionService {
    throw new Error('Not implemented - inject your repositories here');
    // Implementeringen ska skapa repositories och returnera en instans av PermissionService
    // Detta kommer att implementeras när vi har standardberoenden att injicera
  }
} 