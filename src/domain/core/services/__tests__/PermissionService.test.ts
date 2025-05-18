import { DefaultPermissionService } from '@/infrastructure/services/DefaultPermissionService';
import { PermissionService } from '../PermissionService';
import { MockRepositoryFactory } from '@/test-utils/mocks/mockRepositoryFactory';
import { MockEntityFactory } from '@/test-utils/mocks/mockEntityFactory';
import { OrganizationPermission } from '@/domain/organization/value-objects/OrganizationPermission';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { ResourcePermission } from '@/domain/organization/value-objects/ResourcePermission';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { Organization } from '@/domain/organization/entities/Organization';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let mockOrganizationRepository: any;
  let mockTeamRepository: any;
  let mockResourceRepository: any;
  
  // Standard test-ID:n
  const testUserId = 'user-1';
  const testTeamId = 'team-1';
  const testOrgId = 'org-1';
  const testResourceId = 'resource-1';
  
  // Skapa en organisation med en medlemslista
  const createTestOrg = async () => {
    try {
      console.log('Skapar testorganisation...');
      
      // Skapa en enklare mock-organisation direkt för testet
      const organization = {
        id: new UniqueId(testOrgId),
        toString: () => testOrgId,
        props: {
          name: 'Test Organization',
          members: [
            { userId: new UniqueId(testUserId), role: OrganizationRole.ADMIN, joinedAt: new Date() },
            { userId: new UniqueId('user-2'), role: OrganizationRole.MEMBER, joinedAt: new Date() }
          ]
        },
        getMember: (userId: string) => {
          const member = organization.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          return member || null;
        },
        hasMember: (userId: string) => {
          return !!organization.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
        },
        hasRole: (userId: string, role: OrganizationRole | string) => {
          const member = organization.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          
          if (!member) return false;
          
          const roleStr = typeof role === 'string' ? role : role.toString();
          const memberRoleStr = typeof member.role === 'string' ? member.role : member.role.toString();
          
          return memberRoleStr === roleStr;
        },
        hasPermission: (userId: string, permission: OrganizationPermission) => {
          const member = organization.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          
          if (!member) return false;
          
          // Admin har alla rättigheter
          if (member.role === OrganizationRole.ADMIN || 
              member.role.toString() === OrganizationRole.ADMIN) {
            return true;
          }
          
          // Member har bara vissa rättigheter
          if (member.role === OrganizationRole.MEMBER || 
              member.role.toString() === OrganizationRole.MEMBER) {
            // Specifikt test: user-2 ska inte ha MANAGE_SETTINGS behörighet
            if (userId === 'user-2' && permission === OrganizationPermission.MANAGE_SETTINGS) {
              return false;
            }
            
            return [
              OrganizationPermission.VIEW_TEAMS,
              OrganizationPermission.JOIN_TEAM
            ].includes(permission);
          }
          
          return false;
        }
      };
      
      console.log('Testorganisation skapad', organization.id.toString());
      return organization;
    } catch (error) {
      console.error('Fel i createTestOrg:', error);
      throw error;
    }
  };
  
  // Skapa ett team med en medlemslista
  const createTestTeam = async () => {
    try {
      console.log('Skapar testteam...');
      
      // Skapa en enklare mock-team direkt för testet
      const team = {
        id: new UniqueId(testTeamId),
        toString: () => testTeamId,
        props: {
          name: 'Test Team',
          ownerId: new UniqueId(testUserId),
          members: [
            { userId: new UniqueId(testUserId), role: TeamRole.OWNER, joinedAt: new Date() },
            { userId: new UniqueId('user-2'), role: TeamRole.MEMBER, joinedAt: new Date() }
          ]
        },
        getMember: (userId: string) => {
          const member = team.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          return member || null;
        },
        hasMember: (userId: string) => {
          return !!team.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
        },
        hasRole: (userId: string, role: TeamRole | string) => {
          const member = team.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          
          if (!member) return false;
          
          const roleStr = typeof role === 'string' ? role : role.toString();
          const memberRoleStr = typeof member.role === 'string' ? member.role : member.role.toString();
          
          return memberRoleStr === roleStr;
        },
        isOwner: (userId: string) => {
          return team.props.ownerId.toString() === userId || team.props.ownerId === userId;
        },
        hasPermission: (userId: string, permission: TeamPermission) => {
          // Ägaren har alla rättigheter
          if (team.isOwner(userId)) {
            return true;
          }
          
          const member = team.props.members.find(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          
          if (!member) return false;
          
          // Admin har många rättigheter
          if (member.role === TeamRole.ADMIN || 
              member.role.toString() === TeamRole.ADMIN) {
            return permission !== TeamPermission.DELETE_TEAM;
          }
          
          // Member har bara vissa rättigheter
          if (member.role === TeamRole.MEMBER || 
              member.role.toString() === TeamRole.MEMBER) {
            return [
              TeamPermission.VIEW_TEAM,
              TeamPermission.VIEW_MEMBERS
            ].includes(permission);
          }
          
          return false;
        },
        addMember: (userId: string, role: TeamRole | string) => {
          const existingMemberIndex = team.props.members.findIndex(m => 
            m.userId.toString() === userId || m.userId === userId
          );
          
          if (existingMemberIndex >= 0) {
            team.props.members[existingMemberIndex].role = role;
          } else {
            team.props.members.push({
              userId: userId instanceof UniqueId ? userId : new UniqueId(userId),
              role: role,
              joinedAt: new Date()
            });
          }
          
          return team;
        }
      };
      
      console.log('Testteam skapat', team.id.toString());
      return team;
    } catch (error) {
      console.error('Fel i createTestTeam:', error);
      throw error;
    }
  };

  beforeEach(async () => {
    try {
      console.log('Startar testförberedelser...');
      
      // Skapa test-entiteter
      const testOrg = await createTestOrg();
      const testTeam = await createTestTeam();
      
      console.log('Test-entiteter skapade');
      
      // Skapa mock repositories med våra testentiteter
      mockOrganizationRepository = {
        findById: jest.fn().mockImplementation((id) => {
          if (id === testOrgId) {
            return Result.ok(testOrg);
          }
          return Result.err('Organization not found');
        })
      };
      
      mockTeamRepository = {
        findById: jest.fn().mockImplementation((id) => {
          if (id === testTeamId) {
            return Result.ok(testTeam);
          }
          return Result.err('Team not found');
        })
      };
      
      // Mock för ResourceRepository
      mockResourceRepository = {
        findById: jest.fn().mockImplementation((id) => {
          if (id === testResourceId) {
            return Result.ok({
              id: new UniqueId(testResourceId),
              toString: () => testResourceId,
              props: {
                name: 'Test Resource',
                ownerId: new UniqueId(testUserId),
                organizationId: new UniqueId(testOrgId),
                permissionAssignments: [
                  {
                    userId: new UniqueId('user-2'),
                    permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT]
                  }
                ]
              },
              hasPermission: (userId: UniqueId | string, permission: ResourcePermission) => {
                // Ägaren har alla behörigheter
                const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
                if (userIdStr === testUserId) {
                  return true;
                }
                
                // Kolla användarens specifika behörigheter
                const assignment = {
                  userId: new UniqueId('user-2'),
                  permissions: [ResourcePermission.VIEW, ResourcePermission.EDIT]
                };
                
                const assignmentUserIdStr = assignment.userId instanceof UniqueId 
                  ? assignment.userId.toString() 
                  : assignment.userId;
                  
                if (assignmentUserIdStr === userIdStr) {
                  return assignment.permissions.includes(permission);
                }
                
                return false;
              }
            });
          }
          return Result.err('Resource not found');
        })
      };
      
      // Skapa service med våra mocks
      permissionService = new DefaultPermissionService(
        mockOrganizationRepository,
        mockTeamRepository,
        mockResourceRepository
      );
      
      console.log('Testförberedelser klara');
    } catch (error) {
      console.error('Fel i beforeEach:', error);
      throw error;
    }
  });

  describe('hasOrganizationPermission', () => {
    it('ska returnera true när användaren har behörigheten', async () => {
      // Admin-användare ska ha MANAGE_MEMBERS-behörighet
      const result = await permissionService.hasOrganizationPermission(
        testUserId,
        testOrgId,
        OrganizationPermission.MANAGE_MEMBERS
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(testOrgId);
    });
    
    it('ska returnera false när användaren inte har behörigheten', async () => {
      // Testa med en vanlig medlem som inte bör ha MANAGE_SETTINGS
      const result = await permissionService.hasOrganizationPermission(
        'user-2',
        testOrgId,
        OrganizationPermission.MANAGE_SETTINGS
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska returnera error när organisationen inte hittas', async () => {
      const result = await permissionService.hasOrganizationPermission(
        testUserId,
        'non-existent-org',
        OrganizationPermission.MANAGE_MEMBERS
      );
      
      expect(result.isErr()).toBe(true);
    });
  });

  describe('hasTeamPermission', () => {
    it('ska returnera true när användaren har behörigheten som ägare', async () => {
      const result = await permissionService.hasTeamPermission(
        testUserId,
        testTeamId,
        TeamPermission.MANAGE_TEAM
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
      expect(mockTeamRepository.findById).toHaveBeenCalledWith(testTeamId);
    });
    
    it('ska returnera false när användaren är medlem men saknar behörigheten', async () => {
      const result = await permissionService.hasTeamPermission(
        'user-2',
        testTeamId,
        TeamPermission.MANAGE_TEAM
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska returnera false när användaren inte är medlem i teamet', async () => {
      const result = await permissionService.hasTeamPermission(
        'non-member-user',
        testTeamId,
        TeamPermission.VIEW_TEAM
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska returnera error när teamet inte hittas', async () => {
      const result = await permissionService.hasTeamPermission(
        testUserId,
        'non-existent-team',
        TeamPermission.MANAGE_TEAM
      );
      
      expect(result.isErr()).toBe(true);
    });
  });

  describe('hasResourcePermission', () => {
    it('ska returnera true när användaren är ägare av resursen', async () => {
      const result = await permissionService.hasResourcePermission(
        testUserId,
        testResourceId,
        ResourcePermission.MANAGE_PERMISSIONS
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
      expect(mockResourceRepository.findById).toHaveBeenCalledWith(testResourceId);
    });
    
    it('ska returnera true när användaren har specifik behörighet', async () => {
      const result = await permissionService.hasResourcePermission(
        'user-2',
        testResourceId,
        ResourcePermission.EDIT
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
    });
    
    it('ska returnera false när användaren saknar behörighet', async () => {
      const result = await permissionService.hasResourcePermission(
        'user-2',
        testResourceId,
        ResourcePermission.DELETE
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska returnera error när resursen inte hittas', async () => {
      const result = await permissionService.hasResourcePermission(
        testUserId,
        'non-existent-resource',
        ResourcePermission.VIEW
      );
      
      expect(result.isErr()).toBe(true);
    });
  });

  describe('hasOrganizationRole', () => {
    it('ska returnera true när användaren har rollen', async () => {
      const result = await permissionService.hasOrganizationRole(
        testUserId,
        testOrgId,
        OrganizationRole.ADMIN
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
    });
    
    it('ska returnera false när användaren har en annan roll', async () => {
      const result = await permissionService.hasOrganizationRole(
        'user-2',
        testOrgId,
        OrganizationRole.ADMIN
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
    
    it('ska returnera false när användaren inte är medlem', async () => {
      const result = await permissionService.hasOrganizationRole(
        'non-member-user',
        testOrgId,
        OrganizationRole.MEMBER
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
  });

  describe('getOrganizationPermissions', () => {
    it('ska returnera en lista med behörigheter för en admin', async () => {
      const result = await permissionService.getOrganizationPermissions(
        testUserId,
        testOrgId
      );
      
      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value.length).toBeGreaterThan(0);
    });
    
    it('ska returnera en begränsad lista för en vanlig medlem', async () => {
      const result = await permissionService.getOrganizationPermissions(
        'user-2',
        testOrgId
      );
      
      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
    });
    
    it('ska returnera en tom lista för icke-medlemmar', async () => {
      const result = await permissionService.getOrganizationPermissions(
        'non-member-user',
        testOrgId
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('getTeamPermissions', () => {
    it('ska returnera alla behörigheter för teamägaren', async () => {
      const result = await permissionService.getTeamPermissions(
        testUserId,
        testTeamId
      );
      
      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value.length).toBeGreaterThan(0);
    });
    
    it('ska returnera en begränsad lista för en vanlig medlem', async () => {
      const result = await permissionService.getTeamPermissions(
        'user-2',
        testTeamId
      );
      
      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
    });
    
    it('ska returnera en tom lista för icke-medlemmar', async () => {
      const result = await permissionService.getTeamPermissions(
        'non-member-user',
        testTeamId
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('getResourcePermissions', () => {
    it('ska returnera alla behörigheter för resursägaren', async () => {
      const result = await permissionService.getResourcePermissions(
        testUserId,
        testResourceId
      );
      
      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
      expect(result.value.length).toBeGreaterThan(0);
    });
    
    it('ska returnera tilldelade behörigheter för användare med rättigheter', async () => {
      const result = await permissionService.getResourcePermissions(
        'user-2',
        testResourceId
      );
      
      expect(result.isOk()).toBe(true);
      expect(Array.isArray(result.value)).toBe(true);
      // Baserat på vår mock bör användaren ha VIEW och EDIT
      expect(result.value).toContain(ResourcePermission.VIEW);
      expect(result.value).toContain(ResourcePermission.EDIT);
    });
    
    it('ska returnera en tom lista för användare utan rättigheter', async () => {
      const result = await permissionService.getResourcePermissions(
        'non-member-user',
        testResourceId
      );
      
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  // Testa felscenarier
  describe('felhantering', () => {
    it('ska hantera internt fel i hasOrganizationPermission', async () => {
      // Override den interna implementationen för att simulera ett fel
      const mockOrgRepo = {
        findById: jest.fn().mockImplementation(() => {
          throw new Error('Internt fel');
        })
      };
      
      const serviceWithError = new DefaultPermissionService(
        mockOrgRepo as any,
        mockTeamRepository,
        mockResourceRepository
      );
      
      const result = await serviceWithError.hasOrganizationPermission(
        testUserId,
        testOrgId,
        OrganizationPermission.MANAGE_MEMBERS
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ett fel uppstod');
    });
    
    it('ska hantera internt fel i hasTeamPermission', async () => {
      // Override den interna implementationen för att simulera ett fel
      const mockTeamRepo = {
        findById: jest.fn().mockImplementation(() => {
          throw new Error('Internt fel');
        })
      };
      
      const serviceWithError = new DefaultPermissionService(
        mockOrganizationRepository,
        mockTeamRepo as any,
        mockResourceRepository
      );
      
      const result = await serviceWithError.hasTeamPermission(
        testUserId,
        testTeamId,
        TeamPermission.MANAGE_TEAM
      );
      
      expect(result.isErr()).toBe(true);
      expect(result.error).toContain('Ett fel uppstod');
    });
  });
}); 