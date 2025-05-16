import { DefaultPermissionService } from '../DefaultPermissionService';
import { OrganizationPermission } from '@/domain/organization/value-objects/OrganizationPermission';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { TestKit } from '@/test-utils';
import { UniqueEntityID } from '@/domain/core/UniqueEntityID';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

describe('DefaultPermissionService', () => {
  // Skapa mock repositories
  const mockOrganizationRepository = TestKit.mockRepository.createMockOrganizationRepository();
  const mockTeamRepository = TestKit.mockRepository.createMockTeamRepository();
  const mockResourceRepository = TestKit.mockRepository.createMockOrganizationRepository();
  
  // Skapa PermissionService
  const permissionService = new DefaultPermissionService(
    mockOrganizationRepository,
    mockTeamRepository,
    mockResourceRepository as any // Typkompatibilitet
  );
  
  // Testdata
  const userId = 'user-123';
  const ownerId = 'owner-123';
  const organizationId = 'org-123';
  const teamId = 'team-123';
  const resourceId = 'resource-123';
  
  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
  });
  
  describe('hasOrganizationPermission', () => {
    it('should return true for owner with any permission', async () => {
      // Skapa en organisation där användaren är ägare
      const organization = TestKit.mockEntity.createMockOrganization({
        id: organizationId,
        ownerId: userId,
        members: [{ userId: userId, role: OrganizationRole.OWNER, joinedAt: new Date() }]
      }).value;
      
      // Mocha att findById returnerar organisationen
      jest.spyOn(mockOrganizationRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => true, value: organization, isErr: () => false } as any;
      });
      
      // Kontrollera behörighet
      const result = await permissionService.hasOrganizationPermission(
        userId,
        organizationId,
        OrganizationPermission.DELETE_ORGANIZATION
      );
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
    
    it('should return false for non-members', async () => {
      // Skapa en organisation där användaren inte är medlem
      const organization = TestKit.mockEntity.createMockOrganization({
        id: organizationId,
        ownerId: 'other-user',
      }).value;
      
      // Mocha att findById returnerar organisationen
      jest.spyOn(mockOrganizationRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => true, value: organization, isErr: () => false } as any;
      });
      
      // Kontrollera behörighet
      const result = await permissionService.hasOrganizationPermission(
        userId,
        organizationId,
        OrganizationPermission.VIEW_ORGANIZATION
      );
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
    
    it('should handle errors when organization cannot be found', async () => {
      // Mocha att findById returnerar ett fel
      jest.spyOn(mockOrganizationRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => false, error: 'Organisation hittades inte', isErr: () => true } as any;
      });
      
      // Kontrollera behörighet
      const result = await permissionService.hasOrganizationPermission(
        userId,
        organizationId,
        OrganizationPermission.VIEW_ORGANIZATION
      );
      
      // Verifiera resultat
      expect(result.isErr()).toBe(true);
    });
  });
  
  describe('hasTeamPermission', () => {
    it('should return true for team owner with any permission', async () => {
      // Skapa ett team där användaren är ägare
      const team = TestKit.mockEntity.createMockTeam({
        id: teamId,
        ownerId: userId,
        members: [{ userId: userId, role: TeamRole.OWNER, joinedAt: new Date() }]
      }).value;
      
      // Mocha att findById returnerar teamet
      jest.spyOn(mockTeamRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => true, value: team, isErr: () => false } as any;
      });
      
      // Kontrollera behörighet
      const result = await permissionService.hasTeamPermission(
        userId,
        teamId,
        TeamPermission.DELETE_TEAM
      );
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
    
    it('should return false for non-members', async () => {
      // Skapa ett team där användaren inte är medlem
      const team = TestKit.mockEntity.createMockTeam({
        id: teamId,
        ownerId: 'other-user',
        members: [{ userId: 'other-user', role: TeamRole.OWNER, joinedAt: new Date() }]
      }).value;
      
      // Mocha att findById returnerar teamet
      jest.spyOn(mockTeamRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => true, value: team, isErr: () => false } as any;
      });
      
      // Kontrollera behörighet
      const result = await permissionService.hasTeamPermission(
        userId,
        teamId,
        TeamPermission.VIEW_TEAM
      );
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });
  });
  
  describe('hasResourcePermission', () => {
    it('should delegate to resource hasPermission method', async () => {
      // Skapa ett resource-objekt med en hasPermission-metod
      const resource = {
        id: new UniqueEntityID(resourceId),
        props: {
          ownerId: new UniqueEntityID(ownerId),
          permissionAssignments: [
            { userId: new UniqueEntityID(userId), permissions: [ResourcePermission.VIEW] }
          ]
        },
        hasPermission: jest.fn().mockReturnValue(true)
      };
      
      // Mocha att findById returnerar resursen
      jest.spyOn(mockResourceRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => true, value: resource, isErr: () => false } as any;
      });
      
      // Kontrollera behörighet
      const result = await permissionService.hasResourcePermission(
        userId,
        resourceId,
        ResourcePermission.VIEW
      );
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
      expect(resource.hasPermission).toHaveBeenCalled();
    });
  });
  
  describe('getOrganizationPermissions', () => {
    it('should return permissions based on role', async () => {
      // Skapa en organisation där användaren är admin
      const organization = TestKit.mockEntity.createMockOrganization({
        id: organizationId,
        ownerId: 'other-user',
        members: [{ userId: userId, role: OrganizationRole.ADMIN, joinedAt: new Date() }]
      }).value;
      
      // Mocha att findById returnerar organisationen
      jest.spyOn(mockOrganizationRepository, 'findById').mockImplementation(async () => {
        return { isOk: () => true, value: organization, isErr: () => false } as any;
      });
      
      // Hämta behörigheter
      const result = await permissionService.getOrganizationPermissions(
        userId,
        organizationId
      );
      
      // Verifiera resultat
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value).not.toContain(OrganizationPermission.DELETE_ORGANIZATION);
      }
    });
  });
}); 