/**
 * DomainTestHelper
 * 
 * Hjälpfunktioner för att skapa domänobjekt för tester
 */

import { User } from '@/domain/user/entities/User';
import { Team } from '@/domain/team/entities/Team';
import { Organization } from '@/domain/organization/entities/Organization';
import { UniqueEntityID } from '@/domain/core/UniqueEntityID';
import { Email } from '@/domain/user/value-objects/Email';
import { UserProfile } from '@/domain/user/value-objects/UserProfile';
import { TeamSettings } from '@/domain/team/value-objects/TeamSettings';

/**
 * Skapar testdata för domänobjekt
 */
export class DomainTestHelper {
  /**
   * Skapa en testanvändare med givna override-värden
   */
  static createTestUser(overrides: Partial<any> = {}): User {
    const defaultProps = {
      email: Email.create('test@example.com').value,
      name: 'Test User',
      profile: UserProfile.create({
        firstName: 'Test',
        lastName: 'User',
        displayName: 'TestUser'
      }).value,
      isActive: true
    };
    
    const props = { ...defaultProps, ...overrides };
    const id = overrides.id ? new UniqueEntityID(overrides.id) : new UniqueEntityID();
    
    return User.create(props, id).value;
  }

  /**
   * Skapa ett testteam med givna override-värden
   */
  static createTestTeam(overrides: Partial<any> = {}): Team {
    const defaultSettings = TeamSettings.create().value;
    
    const defaultProps = {
      name: 'Test Team',
      description: 'A team for testing',
      organizationId: 'org-123',
      isActive: true,
      settings: overrides.settings || defaultSettings
    };
    
    const props = { ...defaultProps, ...overrides };
    const id = overrides.id ? new UniqueEntityID(overrides.id) : new UniqueEntityID();
    
    return Team.create(props, id).value;
  }

  /**
   * Skapa en testorganisation med givna override-värden
   */
  static createTestOrganization(overrides: Partial<any> = {}): Organization {
    const defaultProps = {
      name: 'Test Organization',
      description: 'An organization for testing',
      isActive: true
    };
    
    const props = { ...defaultProps, ...overrides };
    const id = overrides.id ? new UniqueEntityID(overrides.id) : new UniqueEntityID();
    
    return Organization.create(props, id).value;
  }

  /**
   * Skapa flera testanvändare
   */
  static createTestUsers(count: number): User[] {
    const users: User[] = [];
    
    for (let i = 0; i < count; i++) {
      users.push(this.createTestUser({
        email: Email.create(`test${i}@example.com`).value,
        name: `Test User ${i}`,
        profile: UserProfile.create({
          firstName: 'Test',
          lastName: `User ${i}`,
          displayName: `TestUser${i}`
        }).value
      }));
    }
    
    return users;
  }

  /**
   * Skapa flera testteam
   */
  static createTestTeams(count: number): Team[] {
    const teams: Team[] = [];
    
    for (let i = 0; i < count; i++) {
      teams.push(this.createTestTeam({
        name: `Test Team ${i}`,
        description: `A team for testing ${i}`
      }));
    }
    
    return teams;
  }

  /**
   * Skapa flera testorganisationer
   */
  static createTestOrganizations(count: number): Organization[] {
    const organizations: Organization[] = [];
    
    for (let i = 0; i < count; i++) {
      organizations.push(this.createTestOrganization({
        name: `Test Organization ${i}`,
        description: `An organization for testing ${i}`
      }));
    }
    
    return organizations;
  }
} 