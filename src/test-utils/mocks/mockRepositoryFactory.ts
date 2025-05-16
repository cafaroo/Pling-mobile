import { Result } from '../../shared/core/Result';
import { User } from '../../domain/user/entities/User';
import { Team } from '../../domain/team/entities/Team';
import { Organization } from '../../domain/organization/entities/Organization';
import { UserRepository } from '../../domain/user/repositories/UserRepository';
import { TeamRepository } from '../../domain/team/repositories/TeamRepository';
import { OrganizationRepository } from '../../domain/organization/repositories/OrganizationRepository';
import { MockEntityFactory } from './mockEntityFactory';

/**
 * MockRepositoryFactory tillhandahåller standardiserade mockfunktioner för att skapa
 * mockar av repositories som kan användas i tester.
 */
export class MockRepositoryFactory {
  /**
   * Skapar en mock implementering av UserRepository.
   * 
   * @param mockUsers - Array med mock User-entiteter
   * @param overrides - Override för specifika metodimplementationer
   * @returns En mockad UserRepository
   */
  static createMockUserRepository(
    mockUsers: User[] = [],
    overrides: Partial<UserRepository> = {}
  ): UserRepository {
    // Om inga mockUsers angavs, skapa några standardanvändare
    if (mockUsers.length === 0) {
      mockUsers = MockEntityFactory.createMockUsers(3);
    }
    
    // Skapa en in-memory mockad implementation av UserRepository
    const mockRepository: UserRepository = {
      findById: async (id: string): Promise<Result<User>> => {
        const user = mockUsers.find(u => u.id.toString() === id);
        if (user) {
          return Result.ok(user);
        }
        return Result.err(`User with id ${id} not found`);
      },
      
      findByEmail: async (email: string): Promise<Result<User>> => {
        const user = mockUsers.find(u => u.email === email);
        if (user) {
          return Result.ok(user);
        }
        return Result.err(`User with email ${email} not found`);
      },
      
      findAll: async (): Promise<Result<User[]>> => {
        return Result.ok([...mockUsers]);
      },
      
      save: async (user: User): Promise<Result<void>> => {
        const index = mockUsers.findIndex(u => u.id.equals(user.id));
        if (index !== -1) {
          mockUsers[index] = user;
        } else {
          mockUsers.push(user);
        }
        return Result.ok();
      },
      
      delete: async (id: string): Promise<Result<void>> => {
        const index = mockUsers.findIndex(u => u.id.toString() === id);
        if (index !== -1) {
          mockUsers.splice(index, 1);
          return Result.ok();
        }
        return Result.err(`User with id ${id} not found`);
      },
      
      findByIds: async (ids: string[]): Promise<Result<User[]>> => {
        const users = mockUsers.filter(u => ids.includes(u.id.toString()));
        return Result.ok(users);
      },
      
      findByTeamId: async (teamId: string): Promise<Result<User[]>> => {
        const users = mockUsers.filter(u => u.teamIds.includes(teamId));
        return Result.ok(users);
      },
      
      findByOrganizationId: async (organizationId: string): Promise<Result<User[]>> => {
        // I detta exempel har vi inte organisationsId i användarentiteten, så vi returnerar alla användare
        return Result.ok([...mockUsers]);
      }
    };
    
    // Överskrid med specifika implementationer om sådana finns
    return { ...mockRepository, ...overrides };
  }

  /**
   * Skapar en mock implementering av TeamRepository.
   * 
   * @param mockTeams - Array med mock Team-entiteter
   * @param overrides - Override för specifika metodimplementationer
   * @returns En mockad TeamRepository
   */
  static createMockTeamRepository(
    mockTeams: Team[] = [],
    overrides: Partial<TeamRepository> = {}
  ): TeamRepository {
    // Om inga mockTeams angavs, skapa några standardteam
    if (mockTeams.length === 0) {
      mockTeams = MockEntityFactory.createMockTeams(3);
    }
    
    // Skapa en in-memory mockad implementation av TeamRepository
    const mockRepository: TeamRepository = {
      findById: async (id: string): Promise<Result<Team>> => {
        const team = mockTeams.find(t => t.id.toString() === id);
        if (team) {
          return Result.ok(team);
        }
        return Result.err(`Team with id ${id} not found`);
      },
      
      findAll: async (): Promise<Result<Team[]>> => {
        return Result.ok([...mockTeams]);
      },
      
      save: async (team: Team): Promise<Result<void>> => {
        const index = mockTeams.findIndex(t => t.id.equals(team.id));
        if (index !== -1) {
          mockTeams[index] = team;
        } else {
          mockTeams.push(team);
        }
        return Result.ok();
      },
      
      delete: async (id: string): Promise<Result<void>> => {
        const index = mockTeams.findIndex(t => t.id.toString() === id);
        if (index !== -1) {
          mockTeams.splice(index, 1);
          return Result.ok();
        }
        return Result.err(`Team with id ${id} not found`);
      },
      
      findByUserId: async (userId: string): Promise<Result<Team[]>> => {
        const teams = mockTeams.filter(team => 
          team.members.some(member => member.userId === userId)
        );
        return Result.ok(teams);
      },
      
      findByIds: async (ids: string[]): Promise<Result<Team[]>> => {
        const teams = mockTeams.filter(t => ids.includes(t.id.toString()));
        return Result.ok(teams);
      },
      
      findByOrganizationId: async (organizationId: string): Promise<Result<Team[]>> => {
        // I detta exempel har vi inte organisationsId i teamet, så vi returnerar alla team
        return Result.ok([...mockTeams]);
      }
    };
    
    // Överskrid med specifika implementationer om sådana finns
    return { ...mockRepository, ...overrides };
  }

  /**
   * Skapar en mock implementering av OrganizationRepository.
   * 
   * @param mockOrganizations - Array med mock Organization-entiteter
   * @param overrides - Override för specifika metodimplementationer
   * @returns En mockad OrganizationRepository
   */
  static createMockOrganizationRepository(
    mockOrganizations: Organization[] = [],
    overrides: Partial<OrganizationRepository> = {}
  ): OrganizationRepository {
    // Om inga mockOrganizations angavs, skapa några standardorganisationer
    if (mockOrganizations.length === 0) {
      mockOrganizations = [
        MockEntityFactory.createMockOrganization({ id: 'org-1', name: 'Test Organization 1' }).value,
        MockEntityFactory.createMockOrganization({ id: 'org-2', name: 'Test Organization 2' }).value
      ];
    }
    
    // Skapa en in-memory mockad implementation av OrganizationRepository
    const mockRepository: OrganizationRepository = {
      findById: async (id: string): Promise<Result<Organization>> => {
        const org = mockOrganizations.find(o => o.id.toString() === id);
        if (org) {
          return Result.ok(org);
        }
        return Result.err(`Organization with id ${id} not found`);
      },
      
      findAll: async (): Promise<Result<Organization[]>> => {
        return Result.ok([...mockOrganizations]);
      },
      
      save: async (organization: Organization): Promise<Result<void>> => {
        const index = mockOrganizations.findIndex(o => o.id.equals(organization.id));
        if (index !== -1) {
          mockOrganizations[index] = organization;
        } else {
          mockOrganizations.push(organization);
        }
        return Result.ok();
      },
      
      delete: async (id: string): Promise<Result<void>> => {
        const index = mockOrganizations.findIndex(o => o.id.toString() === id);
        if (index !== -1) {
          mockOrganizations.splice(index, 1);
          return Result.ok();
        }
        return Result.err(`Organization with id ${id} not found`);
      },
      
      findByUserId: async (userId: string): Promise<Result<Organization[]>> => {
        // I detta exempel har vi inte medlemslista i organisationsentiteten, så vi returnerar alla organisationer
        return Result.ok([...mockOrganizations]);
      },
      
      findByIds: async (ids: string[]): Promise<Result<Organization[]>> => {
        const orgs = mockOrganizations.filter(o => ids.includes(o.id.toString()));
        return Result.ok(orgs);
      }
    };
    
    // Överskrid med specifika implementationer om sådana finns
    return { ...mockRepository, ...overrides };
  }

  /**
   * Skapar en mock implementation av ett repo som alltid returnerar fel
   * 
   * @param errorMessage - Meddelandet som ska returneras i varje felresultat
   * @returns Ett mockRepository som alltid misslyckas
   */
  static createErrorRepository<T>(errorMessage: string = 'Repository error'): any {
    return {
      findById: async () => Result.err(errorMessage),
      findAll: async () => Result.err(errorMessage),
      save: async () => Result.err(errorMessage),
      delete: async () => Result.err(errorMessage),
      findByIds: async () => Result.err(errorMessage),
      findByUserId: async () => Result.err(errorMessage),
      findByOrganizationId: async () => Result.err(errorMessage),
      findByEmail: async () => Result.err(errorMessage),
      findByTeamId: async () => Result.err(errorMessage)
    };
  }
} 