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
import { v4 as uuidv4 } from 'uuid';

/**
 * Säker substring-funktion som hanterar både strängar och objekt med toString-metod
 * @param value Värdet att ta substring av
 * @param start Startposition
 * @param end Slutposition (valfri)
 * @returns Substring av värdet
 */
function safeSubstring(value: any, start: number, end?: number): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  let stringValue: string;
  
  try {
    if (typeof value === 'string') {
      stringValue = value;
    } else if (typeof value === 'object' && value !== null) {
      if (value instanceof UniqueId) {
        stringValue = value.toString();
      } else if (typeof value.toString === 'function') {
        // Använd explicit try-catch för toString eftersom det kan kasta fel
        try {
          stringValue = value.toString();
        } catch (error) {
          console.error('Error i toString-anrop:', error);
          stringValue = String(value);
        }
      } else {
        stringValue = String(value);
      }
    } else {
      stringValue = String(value);
    }
    
    if (typeof stringValue !== 'string') {
      console.warn('safeSubstring: toString gav inte en sträng', { 
        originalValue: value, 
        stringValue 
      });
      return ''; // Om vi fortfarande inte har en sträng, returnera tom sträng
    }
    
    return end ? stringValue.substring(start, end) : stringValue.substring(start);
  } catch (error) {
    console.error('Fel i safeSubstring:', error);
    return '';
  }
}

/**
 * Genererar en testemail
 */
function generateTestEmail(prefix: string = 'test'): string {
  const randomId = uuidv4().substring(0, 8);
  return `${prefix}.${randomId}@example.com`;
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
      // Använd angivet ID eller skapa nytt
      const id = teamId ? new UniqueId(teamId) : new UniqueId();
      
      // Skapa ägaren om det behövs
      let ownerId = props.ownerId ? new UniqueId(props.ownerId) : new UniqueId();
      let ownerUser = props.ownerUser;
      
      if (!ownerUser && !props.ownerId) {
        // Skapa en standardägare om ingen angavs
        const ownerResult = await this.createMockUser(ownerId.toString(), {
          firstName: 'Team',
          lastName: 'Owner'
        });
        
        if (ownerResult.isErr()) {
          return Result.err(`Kunde inte skapa teamägare: ${ownerResult.error}`);
        }
        
        ownerUser = ownerResult.value;
        ownerId = ownerUser.id;
      }
      
      // För debugging
      console.log('createMockTeam - ägare:', {
        ownerIdString: ownerId.toString(),
        ownerIdObject: ownerId,
        members: props.members
      });
      
      // Grund-egenskaper för team
      const baseProps = {
        id,
        name: props.name || `Test Team ${safeSubstring(id, 0, 5)}`,
        description: props.description || 'Detta är ett testteam',
        logo: props.logo || null,
        members: props.members || [],
        organizationId: props.organizationId ? new UniqueId(props.organizationId) : new UniqueId(),
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
        ownerId: ownerId,
        settings: props.settings || {
          maxMembers: 10,
          isPublic: true,
          allowInvites: true
        }
      };
      
      // Kontrollera om ägaren redan finns i medlemslistan
      let ownerAlreadyMember = false;
      
      if (baseProps.members && baseProps.members.length > 0) {
        ownerAlreadyMember = baseProps.members.some(
          member => {
            const memberUserId = member.userId instanceof UniqueId 
              ? member.userId.toString() 
              : member.userId.toString();
            
            const ownerIdString = ownerId instanceof UniqueId
              ? ownerId.toString()
              : ownerId.toString();
              
            console.log('Kontrollerar om ägare är medlem:', {
              memberUserId,
              ownerIdString,
              isMatch: memberUserId === ownerIdString
            });
            
            return memberUserId === ownerIdString;
          }
        );
      }
      
      console.log('createMockTeam - ownerAlreadyMember:', ownerAlreadyMember);
      
      // Om ägaren inte är medlem, lägg till som OWNER
      if (!ownerAlreadyMember) {
        // Använd TeamRole.OWNER statiskt värde-objekt
        const ownerRole = TeamRole.OWNER;
        
        // Lägg till ägaren som medlem med ägarroll
        const ownerMemberResult = TeamMember.create({
          userId: ownerId,
          role: ownerRole,
          joinedAt: new Date(),
          isApproved: true
        });
        
        if (ownerMemberResult.isErr()) {
          return Result.err(`Kunde inte skapa ägarmedlem: ${ownerMemberResult.error}`);
        }
        
        console.log('createMockTeam - lägger till ägare som medlem:', {
          ownerId: ownerId.toString(),
          role: ownerRole
        });
        
        baseProps.members = [...baseProps.members, ownerMemberResult.value];
      }
      
      // Skapa teamet
      const result = Team.create(baseProps);
      
      if (result.isErr()) {
        console.error('Fel vid skapande av team:', result.error, { baseProps });
        return result;
      }
      
      return Result.ok(result.value);
    } catch (error) {
      console.error('Exception i createMockTeam:', error);
      return Result.err(`Oväntat fel vid skapande av team: ${error instanceof Error ? error.message : String(error)}`);
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
      // Använd angivet ID eller skapa nytt
      const id = organizationId ? new UniqueId(organizationId) : new UniqueId();
      
      // Skapa ägaren om det behövs
      let ownerId = props.ownerId ? new UniqueId(props.ownerId) : new UniqueId();
      let ownerUser = props.ownerUser;
      
      if (!ownerUser && !props.ownerId) {
        // Skapa en standardägare om ingen angavs
        const ownerResult = await this.createMockUser(ownerId.toString(), {
          firstName: 'Org',
          lastName: 'Owner'
        });
        
        if (ownerResult.isErr()) {
          return Result.err(`Kunde inte skapa organisationsägare: ${ownerResult.error}`);
        }
        
        ownerUser = ownerResult.value;
        ownerId = ownerUser.id;
      }
      
      // Grund-egenskaper för organisation
      const baseProps = {
        id,
        name: props.name || `Test Organization ${safeSubstring(id, 0, 5)}`,
        description: props.description || 'Detta är en testorganisation',
        logo: props.logo || null,
        members: props.members || [],
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
        ownerId: ownerId,
        planId: props.planId || 'basic',
        settings: props.settings || {
          maxTeams: 5,
          maxMembersPerTeam: 10,
          maxMembers: 20,
          features: ['core', 'teams', 'messaging']
        }
      };
      
      // Kontrollera om ägaren redan finns i medlemslistan
      let ownerAlreadyMember = false;
      
      if (baseProps.members.length > 0) {
        ownerAlreadyMember = baseProps.members.some(
          member => member.userId.toString() === ownerId.toString()
        );
      }
      
      // Om ägaren inte är medlem, lägg till som OWNER
      if (!ownerAlreadyMember) {
        // Använd OrganizationRole.OWNER statiskt värde-objekt
        const ownerRole = OrganizationRole.OWNER;
        
        // Lägg till ägaren som medlem med ägarroll
        const ownerMemberResult = OrganizationMember.create({
          userId: ownerId,
          role: ownerRole,
          joinedAt: new Date()
        });
        
        if (ownerMemberResult.isErr()) {
          return Result.err(`Kunde inte skapa ägarmedlem: ${ownerMemberResult.error}`);
        }
        
        baseProps.members = [...baseProps.members, ownerMemberResult.value];
      }
      
      // Skapa organisationen
      const result = Organization.create(baseProps);
      
      if (result.isErr()) {
        return Result.err(`Kunde inte skapa organisation: ${result.error}`);
      }
      
      return Result.ok(result.value);
    } catch (error) {
      return Result.err(`Oväntat fel vid skapande av organisation: ${error instanceof Error ? error.message : String(error)}`);
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
      
      // Använd default-namnkomponenter som garanterat är minst 2 tecken långa
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
        name: props.name || `${defaultFirstName} ${defaultLastName}`, // Lägg till namn
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
          lastName: `Member_${safeSubstring(memberId, 0, 5)}`
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
          lastName: `Member_${safeSubstring(memberId, 0, 5)}`
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

  /**
   * Skapar ett Team-mocksobjekt med en enklare synkron metod för standardiserade tester
   * 
   * Denna metod använder createMockTeam från mockTeamEntities.ts som är synkron, till
   * skillnad från den asynkrona createMockTeam-metoden som används för full integration
   */
  static createMockTeamSync(props: {
    name?: string;
    description?: string;
    ownerId?: string;
    settings?: any;
  } = {}): Result<any, string> {
    try {
      // Importera mockDomainEvents
      const { mockDomainEvents } = require('./mockDomainEvents');
      
      // Rensa eventuella tidigare events
      mockDomainEvents.clearEvents();
      
      // Använd mockTeamEntities.createMockTeam som är synkron
      const team = createMockTeam({
        name: props.name || 'Test Team',
        description: props.description || 'Test description',
        ownerId: props.ownerId || 'test-owner-id',
        settings: props.settings || { maxMembers: 10 }
      });
      
      // Säkerställ att domainEvents är en array och att getDomainEvents returnerar en kopia
      if (!team.domainEvents) {
        team.domainEvents = [];
      }
      
      // Kontrollera att getDomainEvents finns
      if (!team.getDomainEvents) {
        team.getDomainEvents = function() {
          return [...this.domainEvents];
        };
      }
      
      // Se till att addDomainEvent publicerar till både lokal och global eventlista
      const originalAddDomainEvent = team.addDomainEvent;
      team.addDomainEvent = function(event) {
        // Anropa den ursprungliga metoden
        originalAddDomainEvent.call(this, event);
        
        // Publicera också till mockDomainEvents
        mockDomainEvents.publish(event);
      };
      
      // Skapa och publicera en TeamCreatedEvent om den inte redan finns
      if (team.domainEvents.length === 0) {
        const { TeamCreatedEvent } = require('../../domain/team/events/TeamCreatedEvent');
        
        const createdEvent = new TeamCreatedEvent({
          teamId: team.id,
          name: team.name,
          ownerId: team._ownerId || team.ownerId,
          createdAt: new Date()
        });
        
        team.addDomainEvent(createdEvent);
      }
      
      // Lägg till implementering av AggregateRoot-metoder för standardiserade tester
      team.validateInvariants = team.validateInvariants || function() { 
        // Validera obligatoriska fält
        if (!this.name || this.name.trim().length < 2) {
          return err('Teamnamn måste vara minst 2 tecken');
        }
        
        // Validera att ägaren är medlem med OWNER-roll
        const owner = this.members.find((m) => m.userId.toString() === this.ownerId);
        if (!owner) {
          return err('Ägaren måste vara medlem i teamet med OWNER-roll');
        }
        
        // Validera medlemsgränser om de är satta
        if (this.settings && this.settings.maxMembers && this.members.length > this.settings.maxMembers) {
          return err('Teamet har överskridit sin medlemsgräns');
        }
        
        return ok(undefined);
      };
      
      // Anpassa addMember för att hantera invariantTestHelper
      const originalAddMember = team.addMember;
      team.addMember = function(member) {
        // Kontrollera medlemsgränsen (för invariantTesting)
        if (this.settings && this.settings.maxMembers && this.members.length >= this.settings.maxMembers) {
          return err('Teamet har nått sin maximala medlemsgräns');
        }
        
        // Anropa den ursprungliga metoden
        return originalAddMember.call(this, member);
      };
      
      // Anpassa removeMember för att hantera invariantTestHelper
      const originalRemoveMember = team.removeMember;
      team.removeMember = function(userId) {
        // Kontrollera om det är ägaren (för invariantTesting)
        const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
        if (userIdStr === this.ownerId) {
          return err('Ägaren kan inte tas bort från teamet');
        }
        
        // Anropa den ursprungliga metoden
        return originalRemoveMember.call(this, userId);
      };
      
      return ok(team);
    } catch (error) {
      return err(`Kunde inte skapa mock team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default MockEntityFactory; 