/**
 * MockEntityFactory
 * 
 * Factory för att skapa mock-versioner av domänentiteter för tester
 */

import { Result, ok, err } from '@/shared/core/Result';
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
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';
import { MockTeam, createMockTeam } from './mockTeamEntities';
import { mockDomainEvents } from './mockDomainEvents';
import { OrganizationCreatedEvent } from './mockOrganizationEvents';
import { Email } from '@/domain/user/value-objects/Email';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';

/**
 * Hjälpfunktion för att säkert hämta en del av en sträng
 * Returnerar en tom sträng om ingången är null, undefined eller inte en sträng
 */
function safeSubstring(str: any, start: number, end?: number): string {
  if (str === null || str === undefined || typeof str !== 'string') {
    return '';
  }
  try {
    return end ? str.substring(start, end) : str.substring(start);
  } catch (error) {
    return '';
  }
}

/**
 * Genererar en slumpmässig e-postadress för testsyften
 */
function generateTestEmail(prefix: string = 'test'): string {
  const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}_${randomPart}@example.com`;
}

/**
 * MockEntityFactory
 * 
 * Denna factory används för att skapa mockade domän-entiteter för testning.
 * 
 * OBS: Subscription-relaterade entiteter är tillfälligt borttagna 
 * för att lösa beroendeproblem i testerna. Subscription-domänen
 * kommer att implementeras senare.
 */
export class MockEntityFactory {
  /**
   * Skapa en mock-User
   */
  static async createUser(props: Partial<any> = {}): Promise<User> {
    try {
      // Se till att e-post alltid är valid om den anges
      let userId = undefined;
      if (props.id) {
        userId = props.id instanceof UniqueId ? props.id.toString() : props.id;
        // Ta bort id-egenskapen så att den inte används dubbelt
        delete props.id;
      }
      
      const result = await this.createMockUser(userId, props);
      
      if (result.isErr()) {
        throw new Error(`Kunde inte skapa användare: ${result.error}`);
      }
      
      return result.value;
    } catch (error) {
      console.error('Fel i createUser:', error);
      throw error;
    }
  }
  
  /**
   * Skapa en mock-Team
   */
  static async createTeam(props: Partial<any> = {}): Promise<Team> {
    try {
      let teamId = undefined;
      if (props.id) {
        teamId = props.id instanceof UniqueId ? props.id.toString() : props.id;
        // Ta bort id-egenskapen så att den inte används dubbelt
        delete props.id;
      }
      
      const result = await this.createMockTeam(teamId, props);
      
      if (result.isErr()) {
        throw new Error(`Kunde inte skapa team: ${result.error}`);
      }
      
      return result.value;
    } catch (error) {
      console.error('Fel i createTeam:', error);
      throw error;
    }
  }
  
  /**
   * Skapa en mock-Organization
   * 
   * Denna metod skapar automatiskt en OrganizationMember för ägaren
   * för att uppfylla invarianten att ägaren måste vara medlem
   * med OWNER-roll.
   */
  static async createMockOrganization(
    organizationId: string | undefined = undefined,
    props: Partial<OrganizationProps> = {}
  ): Promise<Result<Organization, string>> {
    try {
      // Skapa unika ID:n om de inte är angivna
      const id = organizationId ? new UniqueId(organizationId) : new UniqueId();
      
      // Skapa en ägare om den inte är angiven
      let owner: User;
      if (props.ownerUser) {
        owner = props.ownerUser;
      } else if (props.ownerId) {
        const ownerId = props.ownerId instanceof UniqueId ? props.ownerId.toString() : props.ownerId;
        const ownerResult = await this.createUser({ id: ownerId });
        owner = ownerResult;
      } else {
        const ownerResult = await this.createUser();
        owner = ownerResult;
      }
      
      const ownerId = owner.id;
      
      // Skapa en standardlista med medlemmar om ingen är angiven
      let orgMembers = props.members || [];
      
      // Se till att minst en medlem finns (ägaren)
      const ownerAlreadyMember = orgMembers.some(m => {
        try {
          return m.userId.equals(ownerId);
        } catch (error) {
          return false;
        }
      });
      
      if (!ownerAlreadyMember) {
        // Skapa OrganizationRole.OWNER värde-objekt
        const ownerRoleResult = OrganizationRole.owner();
        if (ownerRoleResult.isErr()) {
          throw new Error(`Kunde inte skapa OrganizationRole.OWNER: ${ownerRoleResult.error}`);
        }
        
        // Lägg till ägaren som medlem med ägarroll
        const ownerMemberResult = OrganizationMember.create({
          userId: ownerId,
          role: ownerRoleResult.value,
          joinedAt: new Date()
        });
        
        if (ownerMemberResult.isErr()) {
          throw new Error(`Kunde inte skapa ägarmembership: ${ownerMemberResult.error}`);
        }
        
        orgMembers.push(ownerMemberResult.value);
      }
      
      // Skapa en enkel Organization-instans med standardvärden
      const organizationResult = Organization.create({
        id,
        name: props.name || `Test Organization ${id.toString().substring(0, 5)}`,
        description: props.description || `Test Organization description`,
        ownerId,
        members: orgMembers,
        isVerified: props.isVerified ?? false,
        settings: props.settings || { maxTeams: 5, maxMembers: 50 },
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
        resources: props.resources || []
      });
      
      if (organizationResult.isErr()) {
        throw new Error(`Kunde inte skapa organisation: ${organizationResult.error}`);
      }
      
      return organizationResult;
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Okänt fel vid skapande av mock-organisation');
    }
  }
  
  /**
   * Skapa en mock User med standardvärden
   * 
   * @param userId - Valfritt användar-ID
   * @param props - Anpassade egenskaper
   * @returns Result med en User eller felmeddelande
   */
  public static async createMockUser(
    userId: string | undefined = undefined,
    props: Partial<UserProps> = {}
  ): Promise<Result<User, string>> {
    try {
      const id = userId ? new UniqueId(userId) : new UniqueId();
      
      // Använd default-namnkomponenter som är minst 2 tecken långa
      const defaultFirstName = props.firstName || 'TestUser';
      const defaultLastName = props.lastName || 'TestLastName';
      
      // Skapa en simulerad email med unik ID för att undvika kollisioner
      const defaultEmail = props.email || `test.${id.toString()}@example.com`;
      
      // Skapa ett UserProfile-objekt
      const profileResult = UserProfile.create({
        firstName: defaultFirstName,
        lastName: defaultLastName,
        displayName: props.displayName,
        bio: props.bio,
        avatarUrl: props.avatarUrl,
        location: props.location,
        interests: props.interests,
        socialLinks: props.socialLinks
      });
      
      if (profileResult.isErr()) {
        throw new Error(`Kunde inte skapa UserProfile: ${profileResult.error}`);
      }
      
      // Skapa en Email från den angivna eller genererade e-postadressen
      const emailResult = Email.create(defaultEmail);
      
      if (emailResult.isErr()) {
        throw new Error(`Kunde inte skapa Email: ${emailResult.error}`);
      }
      
      // Skapa en UserSettings med standardvärden
      const settingsResult = UserSettings.create({
        language: props.language || 'sv',
        theme: props.theme || 'light',
        notifications: props.notifications || { email: true, push: true }
      });
      
      if (settingsResult.isErr()) {
        throw new Error(`Kunde inte skapa UserSettings: ${settingsResult.error}`);
      }
      
      // Skapa användaren med alla värden
      const userResult = User.create({
        id,
        profile: profileResult.value,
        email: emailResult.value,
        settings: settingsResult.value,
        isVerified: props.isVerified ?? true,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      });
      
      if (userResult.isErr()) {
        throw new Error(`Kunde inte skapa användare: ${userResult.error}`);
      }
      
      return userResult;
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Okänt fel vid skapande av mock-användare');
    }
  }
  
  /**
   * Skapa en mock-Team
   * 
   * Denna metod skapar automatiskt en TeamMember för ägaren
   * för att uppfylla invarianten att ägaren måste vara medlem
   * med OWNER-roll.
   */
  static async createMockTeam(
    teamId: string | undefined = undefined,
    props: Partial<TeamProps> = {}
  ): Promise<Result<Team, string>> {
    try {
      // Skapa unika ID:n om de inte är angivna
      const id = teamId ? new UniqueId(teamId) : new UniqueId();
      
      // Skapa en ägare om den inte är angiven
      let owner: User;
      if (props.ownerUser) {
        owner = props.ownerUser;
      } else if (props.ownerId) {
        const ownerId = props.ownerId instanceof UniqueId ? props.ownerId.toString() : props.ownerId;
        const ownerResult = await this.createUser({ id: ownerId });
        owner = ownerResult;
      } else {
        const ownerResult = await this.createUser();
        owner = ownerResult;
      }
      
      const ownerId = owner.id;
      
      // Skapa en standardlista med medlemmar om ingen är angiven
      let teamMembers = props.members || [];
      
      // Se till att minst en medlem finns (ägaren)
      const ownerAlreadyMember = teamMembers.some(m => {
        try {
          return m.userId.equals(ownerId);
        } catch (error) {
          return false;
        }
      });
      
      if (!ownerAlreadyMember) {
        // Skapa TeamRole.OWNER värde-objekt
        const ownerRoleResult = TeamRole.owner();
        if (ownerRoleResult.isErr()) {
          throw new Error(`Kunde inte skapa TeamRole.OWNER: ${ownerRoleResult.error}`);
        }
        
        // Lägg till ägaren som medlem med ägarroll
        const ownerMemberResult = TeamMember.create({
          userId: ownerId,
          role: ownerRoleResult.value,
          joinedAt: new Date(),
          isApproved: true
        });
        
        if (ownerMemberResult.isErr()) {
          throw new Error(`Kunde inte skapa ägarmembership: ${ownerMemberResult.error}`);
        }
        
        teamMembers.push(ownerMemberResult.value);
      }
      
      // Skapa ett organization-ID om det behövs
      let organizationId = props.organizationId;
      if (organizationId) {
        organizationId = organizationId instanceof UniqueId ? 
          organizationId : 
          new UniqueId(organizationId.toString());
      }
      
      // Skapa en enkel Team-instans med standardvärden
      const teamResult = Team.create({
        id,
        name: props.name || `Test Team ${id.toString().substring(0, 5)}`,
        description: props.description || `Test Team description`,
        ownerId,
        organizationId,
        members: teamMembers,
        isPrivate: props.isPrivate ?? false,
        settings: props.settings || { maxMembers: 10 },
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      });
      
      if (teamResult.isErr()) {
        throw new Error(`Kunde inte skapa team: ${teamResult.error}`);
      }
      
      return teamResult;
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Okänt fel vid skapande av mock-team');
    }
  }
  
  /**
   * Skapa en TeamMember för användning i tester
   */
  static createTeamMember(props: Partial<{
    userId: string | UniqueId;
    role: TeamRole;
    joinedAt: Date;
    isApproved: boolean;
  }> = {}): Result<TeamMember, string> {
    try {
      const userId = props.userId ? 
        (props.userId instanceof UniqueId ? props.userId : new UniqueId(props.userId)) : 
        new UniqueId();
      
      // Skapa TeamRole om det inte redan är ett TeamRole-objekt
      let role: TeamRole;
      if (props.role instanceof TeamRole) {
        role = props.role;
      } else {
        const roleResult = TeamRole.create(props.role || TeamRole.MEMBER);
        if (roleResult.isErr()) {
          return err(`Kunde inte skapa TeamRole: ${roleResult.error}`);
        }
        role = roleResult.value;
      }
      
      return TeamMember.create({
        userId: userId,
        role: role,
        joinedAt: props.joinedAt || new Date(),
        isApproved: props.isApproved !== undefined ? props.isApproved : true
      });
    } catch (error) {
      return err(`Kunde inte skapa team-medlem: ${error instanceof Error ? error.message : String(error)}`);
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

  /**
   * Skapar ett test-team med testanvändare för testning
   * Enklare gränssnitt för testmiljö
   */
  static async createTestTeam(options: {
    teamId?: string;
    teamName?: string;
    organizationId?: string;
    ownerId?: string;
    memberIds?: string[];
  } = {}): Promise<{
    team: Team;
    owner: User;
    members: User[];
  }> {
    try {
      // Skapa standardägare
      const owner = await this.createMockUser({
        id: options.ownerId || 'test-owner-id',
        firstName: 'Team',
        lastName: 'Owner'
      });
      
      // Skapa medlemmar om de är angivna
      const memberPromises = (options.memberIds || []).map(memberId => 
        this.createMockUser({
          id: memberId,
          firstName: 'Team',
          lastName: `Member_${memberId.substring(0, 5)}`
        })
      );
      
      const members = await Promise.all(memberPromises);
      
      // Skapa teammedlemsobjekt för alla medlemmar
      const teamMembers = members.map(user => ({
        userId: user.id,
        role: TeamRole.MEMBER,
        joinedAt: new Date()
      }));
      
      // Lägg till ägaren som medlem med ägarroll
      teamMembers.push({
        userId: owner.id,
        role: TeamRole.OWNER,
        joinedAt: new Date()
      });
      
      // Skapa teamet
      const team = await this.createMockTeam({
        id: options.teamId || 'test-team-id',
        name: options.teamName || 'Test Team',
        organizationId: options.organizationId || 'test-org-id',
        ownerUser: owner,
        members: teamMembers
      });
      
      // Returnera resultaten som ett objekt för enklare åtkomst i tester
      return {
        team,
        owner,
        members
      };
    } catch (error) {
      console.error('Fel vid skapande av testTeam:', error);
      throw error;
    }
  }

  /**
   * Skapar en testorganisation med testanvändare för testning
   * Enklare gränssnitt för testmiljö
   */
  static async createTestOrganization(options: {
    organizationId?: string;
    organizationName?: string;
    adminId?: string;
    memberIds?: string[];
  } = {}): Promise<{
    organization: Organization;
    admin: User;
    members: User[];
  }> {
    try {
      // Skapa standardadmin
      const admin = await this.createMockUser({
        id: options.adminId || 'test-admin-id',
        firstName: 'Organization',
        lastName: 'Admin'
      });
      
      // Skapa medlemmar om de är angivna
      const memberPromises = (options.memberIds || []).map(memberId => 
        this.createMockUser({
          id: memberId,
          firstName: 'Organization',
          lastName: `Member_${memberId.substring(0, 5)}`
        })
      );
      
      const members = await Promise.all(memberPromises);
      
      // Skapa organisationsmedlemsobjekt för alla medlemmar
      const orgMembers = members.map(user => ({
        userId: user.id,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      }));
      
      // Lägg till admin som medlem med adminroll
      orgMembers.push({
        userId: admin.id,
        role: OrganizationRole.ADMIN,
        joinedAt: new Date()
      });
      
      // Skapa organisationen
      const organization = await this.createMockOrganization({
        id: options.organizationId || 'test-org-id',
        name: options.organizationName || 'Test Organization',
        adminUser: admin,
        members: orgMembers
      });
      
      // Returnera resultaten som ett objekt för enklare åtkomst i tester
      return {
        organization,
        admin,
        members
      };
    } catch (error) {
      console.error('Fel vid skapande av testOrganization:', error);
      throw error;
    }
  }

  /**
   * Skapa en Organization för teständamål
   */
  public static async createOrganization(
    organizationId: string | undefined = undefined,
    props: Partial<OrganizationProps> = {}
  ): Promise<Organization> {
    const result = await this.createMockOrganization(organizationId, props);
    
    if (result.isErr()) {
      throw new Error(`Kunde inte skapa organisation: ${result.error}`);
    }
    
    return result.value;
  }
}

export default MockEntityFactory; 