import { Result } from '@/shared/core/Result';
import { MockRepositoryFactory } from '../mocks/mockRepositoryFactory';
import { MockServiceFactory } from '../mocks/mockServiceFactory';
import { PermissionService } from '@/domain/core/services/PermissionService';
import { FeatureFlagService } from '@/domain/subscription/interfaces/FeatureFlagService';
import { Organization } from '@/domain/organization/entities/Organization';
import { Team } from '@/domain/team/entities/Team';
import { User } from '@/domain/user/entities/User';

/**
 * Helper för att testa domäntjänster enligt DDD-principer
 * 
 * Denna hjälpklass förenklar skapandet av mockade repositories och tjänster
 * för testning av domäntjänster, samt tillhandahåller hjälpmetoder för att
 * validera resultat och simulera olika scenarier.
 */
export class DomainServiceTestHelper {
  /**
   * Skapar en mockad implementation av PermissionService för testning
   * 
   * @param overrides - Anpassningar för specifika metodbeteenden
   * @returns En mockad PermissionService
   */
  static createMockPermissionService(overrides: any = {}): PermissionService {
    return MockServiceFactory.createMockPermissionService(overrides);
  }
  
  /**
   * Skapar en mockad implementation av FeatureFlagService för testning
   * 
   * @param overrides - Anpassningar för specifika metodbeteenden
   * @returns En mockad FeatureFlagService
   */
  static createMockFeatureFlagService(overrides: any = {}): FeatureFlagService {
    return MockServiceFactory.createMockFeatureFlagService(overrides);
  }
  
  /**
   * Skapar en mock implementation av ett repository som alltid returnerar en specifik entitet
   * 
   * @param entity - Entiteten som ska returneras av findById
   * @returns Ett mockRepository som returnerar den specificerade entiteten
   */
  static createMockRepositoryWithEntity<T>(entity: T): any {
    return {
      findById: jest.fn().mockResolvedValue(Result.ok(entity)),
      findAll: jest.fn().mockResolvedValue(Result.ok([entity])),
      save: jest.fn().mockResolvedValue(Result.ok()),
      delete: jest.fn().mockResolvedValue(Result.ok())
    };
  }
  
  /**
   * Skapar en mock implementation av ett repository som alltid returnerar specifika entiteter
   * 
   * @param entities - Map med ID:n som nycklar och entiteter som värden
   * @returns Ett mockRepository som returnerar entiteter baserat på ID
   */
  static createMockRepositoryWithEntityMap<T>(entities: Map<string, T>): any {
    return {
      findById: jest.fn().mockImplementation((id: string) => {
        const entity = entities.get(id);
        if (entity) {
          return Promise.resolve(Result.ok(entity));
        }
        return Promise.resolve(Result.err(`Entity with id ${id} not found`));
      }),
      
      findAll: jest.fn().mockResolvedValue(Result.ok(Array.from(entities.values()))),
      
      save: jest.fn().mockImplementation((entity: any) => {
        if (entity && entity.id) {
          entities.set(entity.id.toString(), entity);
          return Promise.resolve(Result.ok());
        }
        return Promise.resolve(Result.err('Invalid entity'));
      }),
      
      delete: jest.fn().mockImplementation((id: string) => {
        if (entities.has(id)) {
          entities.delete(id);
          return Promise.resolve(Result.ok());
        }
        return Promise.resolve(Result.err(`Entity with id ${id} not found`));
      })
    };
  }
  
  /**
   * Skapar en mock implementation av ett repository som alltid returnerar fel
   * 
   * @param errorMessage - Felmeddelandet som ska returneras
   * @returns Ett mockRepository som alltid misslyckas
   */
  static createMockErrorRepository(errorMessage: string = 'Mock repository error'): any {
    return MockRepositoryFactory.createErrorRepository(errorMessage);
  }
  
  /**
   * Skapar en mock implementation av en domäntjänst som alltid lyckas
   * 
   * @param methodNames - Lista med metodnamn som ska mockas
   * @returns Ett mockobjekt med metoder som alltid returnerar framgång
   */
  static createMockSuccessService(methodNames: string[]): any {
    const mockService: any = {};
    
    methodNames.forEach(methodName => {
      mockService[methodName] = jest.fn().mockResolvedValue(Result.ok(true));
    });
    
    return mockService;
  }
  
  /**
   * Skapar en mock implementation av en domäntjänst som alltid misslyckas
   * 
   * @param methodNames - Lista med metodnamn som ska mockas
   * @param errorMessage - Felmeddelandet som ska returneras
   * @returns Ett mockobjekt med metoder som alltid returnerar fel
   */
  static createMockErrorService(methodNames: string[], errorMessage: string = 'Mock service error'): any {
    const mockService: any = {};
    
    methodNames.forEach(methodName => {
      mockService[methodName] = jest.fn().mockResolvedValue(Result.err(errorMessage));
    });
    
    return mockService;
  }
  
  /**
   * Validerar att en Result<T> är framgångsrik och har förväntat värde
   * 
   * @param result - Result-objektet att validera
   * @param expectedValue - Det förväntade värdet (om specificerat)
   */
  static validateSuccessResult<T>(result: Result<T>, expectedValue?: T): void {
    expect(result.isOk()).toBe(true);
    
    if (expectedValue !== undefined) {
      expect(result.value).toEqual(expectedValue);
    }
  }
  
  /**
   * Validerar att en Result<T> är ett fel och har förväntat felmeddelande
   * 
   * @param result - Result-objektet att validera
   * @param expectedErrorPattern - Mönster som felmeddelandet ska matcha (om specificerat)
   */
  static validateErrorResult<T>(result: Result<T, string>, expectedErrorPattern?: RegExp | string): void {
    expect(result.isErr()).toBe(true);
    
    if (expectedErrorPattern !== undefined) {
      if (expectedErrorPattern instanceof RegExp) {
        expect(result.error).toMatch(expectedErrorPattern);
      } else {
        expect(result.error).toContain(expectedErrorPattern);
      }
    }
  }
  
  /**
   * Kombinerar flera mockade repositories till ett objekt för enkel injektion
   * 
   * @param repos - Objekt med repository-namn som nycklar och mockar som värden
   * @returns Ett objekt med alla repositories
   */
  static combineRepositories(repos: Record<string, any>): Record<string, any> {
    return repos;
  }
  
  /**
   * Hjälpmetod för att skapa testexempel för domäntjänster
   * 
   * @returns Ett objekt med testdata
   */
  static createTestDomainData() {
    return {
      users: {
        admin: User.create({
          email: 'admin@example.com',
          name: 'Admin User',
          roleIds: ['admin-role'],
          teamIds: ['team-1'],
          isActive: true
        }, 'user-admin').value,
        
        regular: User.create({
          email: 'user@example.com',
          name: 'Regular User',
          roleIds: ['user-role'],
          teamIds: ['team-1'],
          isActive: true
        }, 'user-regular').value,
        
        inactive: User.create({
          email: 'inactive@example.com',
          name: 'Inactive User',
          roleIds: [],
          teamIds: [],
          isActive: false
        }, 'user-inactive').value
      },
      
      teams: {
        main: Team.create({
          name: 'Main Team',
          description: 'Main test team',
          ownerId: 'user-admin',
          members: [
            { userId: 'user-admin', role: 'OWNER', joinedAt: new Date() },
            { userId: 'user-regular', role: 'MEMBER', joinedAt: new Date() }
          ],
          settings: {
            maxMembers: 10,
            isPrivate: false
          }
        }, 'team-1').value,
        
        private: Team.create({
          name: 'Private Team',
          description: 'Private test team',
          ownerId: 'user-admin',
          members: [
            { userId: 'user-admin', role: 'OWNER', joinedAt: new Date() }
          ],
          settings: {
            maxMembers: 5,
            isPrivate: true
          }
        }, 'team-2').value
      },
      
      organizations: {
        main: Organization.create({
          name: 'Test Organization',
          ownerId: 'user-admin',
          teamIds: ['team-1', 'team-2'],
          settings: {
            maxMembers: 50,
            maxTeams: 10
          }
        }, 'org-1').value
      }
    };
  }
} 