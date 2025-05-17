/**
 * MockEntityFactory
 * 
 * Factory för att skapa mock-versioner av domänentiteter för tester
 */

import { Result, ok } from '@/shared/core/Result';
import { User } from '@/domain/user/entities/User';
import { Team } from '@/domain/team/entities/Team';
import { Organization } from '@/domain/organization/entities/Organization';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamName } from '@/domain/team/value-objects/TeamName';
import { TeamDescription } from '@/domain/team/value-objects/TeamDescription';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { TeamSettings } from '@/domain/team/entities/TeamSettings';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

/**
 * MockEntityFactory för att skapa testentiteter
 */
export class MockEntityFactory {
  /**
   * Skapa en mock-User (bakåtkompatibel metod)
   * @deprecated Använd createMockUser som returnerar Result istället
   */
  static createUser(props: Partial<any> = {}): User {
    const result = this.createMockUser(props);
    if (result.isErr()) {
      throw new Error(`Kunde inte skapa mock-user: ${result.error}`);
    }
    return result.value;
  }
  
  /**
   * Skapa en mock-Team (bakåtkompatibel metod)
   * @deprecated Använd createMockTeam som returnerar Result istället
   */
  static createTeam(props: Partial<any> = {}): Team {
    const result = this.createMockTeam(props);
    if (result.isErr()) {
      throw new Error(`Kunde inte skapa mock-team: ${result.error}`);
    }
    return result.value;
  }
  
  /**
   * Skapa en mock-Organization (bakåtkompatibel metod)
   * @deprecated Använd createMockOrganization som returnerar Result istället
   */
  static createOrganization(props: Partial<any> = {}): Organization {
    const result = this.createMockOrganization(props);
    if (result.isErr()) {
      throw new Error(`Kunde inte skapa mock-organization: ${result.error}`);
    }
    return result.value;
  }

  /**
   * Skapa en Result-baserad mock-User
   */
  static createMockUser(props: Partial<{
    id: string;
    email: string;
    name: string;
    teamIds?: string[];
    roleIds?: string[];
  }> = {}): Result<User, string> {
    try {
      // Skapa default UserSettings
      const settingsResult = UserSettings.create({
        theme: 'light',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          inApp: true
        },
        privacy: {
          showProfile: true,
          showActivity: true,
          showTeams: true
        }
      });
      
      if (settingsResult.isErr()) {
        return Result.err(`Kunde inte skapa inställningar: ${settingsResult.error}`);
      }
      
      // Skapa default UserProfile
      const profileResult = UserProfile.create({
        firstName: props.name ? props.name.split(' ')[0] : 'Test',
        lastName: props.name ? props.name.split(' ').slice(1).join(' ') : 'Användare',
        displayName: props.name || 'Test Användare',
      });
      
      if (profileResult.isErr()) {
        return Result.err(`Kunde inte skapa profil: ${profileResult.error}`);
      }
      
      // Skapa användare
      return User.create({
        email: props.email || 'test@example.com',
        name: props.name || 'Test Användare',
        profile: profileResult.value,
        settings: settingsResult.value,
        teamIds: props.teamIds || [],
        roleIds: props.roleIds || []
      }, props.id ? new UniqueId(props.id) : undefined);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av mock-user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapa en Result-baserad mock-Team
   * 
   * Denna metod skapar automatiskt en TeamMember för ägaren
   * för att uppfylla invarianten att ägaren måste vara medlem
   * med OWNER-rollen.
   */
  static createMockTeam(props: Partial<{
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    settings?: Partial<any>;
    members?: TeamMember[];
  }> = {}): Result<Team, string> {
    try {
      // Skapa en default ownerId om det inte finns
      const ownerId = props.ownerId || 'owner-123';
      
      // Förbereda för Team.create genom att använda ett enkelt objekt
      // eftersom TeamCreateDTO förväntar sig en enkel struktur
      const createTeamInput = {
        name: props.name || 'Test Team',
        description: props.description,
        ownerId: ownerId,
        settings: props.settings
      };

      // Anropa Team.create som internt kommer skapa ägaren som en TeamMember
      return Team.create(createTeamInput);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av mock-team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapa en TeamMember för användning i tester
   */
  static createTeamMember(props: Partial<{
    userId: string;
    role: TeamRole;
    joinedAt: Date;
    isApproved: boolean;
  }> = {}): Result<TeamMember, string> {
    try {
      const userId = props.userId ? new UniqueId(props.userId) : new UniqueId();
      return TeamMember.create({
        userId: userId,
        role: props.role || TeamRole.MEMBER,
        joinedAt: props.joinedAt || new Date(),
        isApproved: props.isApproved !== undefined ? props.isApproved : true
      });
    } catch (error) {
      return Result.err(`Kunde inte skapa team-medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapa en Result-baserad mock-Organization
   */
  static createMockOrganization(props: Partial<{
    id: string;
    name: string;
    description?: string;
    ownerId?: string;
  }> = {}): Result<Organization, string> {
    try {
      // Detta bör anpassas efter den faktiska implementationen av Organization
      return Organization.create({
        name: props.name || 'Test Organization',
        description: props.description || 'Test description',
        ownerId: props.ownerId || 'owner-123'
      }, props.id ? new UniqueId(props.id) : undefined);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av mock-organization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapa flera mock-Users
   */
  static createMockUsers(count: number, baseProps: Partial<any> = {}): Result<User[], string> {
    try {
      const users: User[] = [];
      
      for (let i = 0; i < count; i++) {
        const userResult = this.createMockUser({
          ...baseProps,
          email: `test${i}@example.com`,
          name: `Test Användare ${i}`,
          id: baseProps.id ? `${baseProps.id}-${i}` : `user-${i}`
        });
        
        if (userResult.isErr()) {
          return Result.err(`Kunde inte skapa användare ${i}: ${userResult.error}`);
        }
        
        users.push(userResult.value);
      }
      
      return Result.ok(users);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av mock-users: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapa flera mock-Teams
   */
  static createMockTeams(count: number, baseProps: Partial<any> = {}): Result<Team[], string> {
    try {
      const teams: Team[] = [];
      
      for (let i = 0; i < count; i++) {
        const teamResult = this.createMockTeam({
          ...baseProps,
          name: `Test Team ${i}`,
          description: `Test description ${i}`,
          id: baseProps.id ? `${baseProps.id}-${i}` : `team-${i}`,
          ownerId: baseProps.ownerId || 'owner-123'
        });
        
        if (teamResult.isErr()) {
          return Result.err(`Kunde inte skapa team ${i}: ${teamResult.error}`);
        }
        
        teams.push(teamResult.value);
      }
      
      return Result.ok(teams);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av mock-teams: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Skapa flera mock-Organizations
   */
  static createMockOrganizations(count: number, baseProps: Partial<any> = {}): Result<Organization[], string> {
    try {
      const organizations: Organization[] = [];
      
      for (let i = 0; i < count; i++) {
        const orgResult = this.createMockOrganization({
          ...baseProps,
          name: `Test Organization ${i}`,
          description: `Test description ${i}`,
          id: baseProps.id ? `${baseProps.id}-${i}` : `org-${i}`,
          ownerId: baseProps.ownerId || 'owner-123'
        });
        
        if (orgResult.isErr()) {
          return Result.err(`Kunde inte skapa organisation ${i}: ${orgResult.error}`);
        }
        
        organizations.push(orgResult.value);
      }
      
      return Result.ok(organizations);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av mock-organizations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default MockEntityFactory; 