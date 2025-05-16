import { User } from '../../domain/user/entities/User';
import { Team } from '../../domain/team/entities/Team';
import { Organization } from '../../domain/organization/entities/Organization';
import { Result } from '../../shared/core/Result';
import { UniqueEntityID } from '../../domain/core/UniqueEntityID';
import { TeamMember } from '../../domain/team/value-objects/TeamMember';
import { TeamRole } from '../../domain/team/value-objects/TeamRole';

/**
 * MockEntityFactory tillhandahåller standardiserade mockfunktioner för att skapa
 * domänentiteter som kan användas i tester.
 */
export class MockEntityFactory {
  /**
   * Skapar en mock User-entitet med standardvärden.
   * 
   * @param props - Överskrivningsvärden för User-objektet
   * @returns Result med User-entiteten
   */
  static createMockUser(props: Partial<{
    id: string;
    email: string;
    name: string;
    roleIds: string[];
    teamIds: string[];
    isActive: boolean;
  }> = {}): Result<User> {
    return User.create({
      email: props.email || 'test@example.com',
      name: props.name || 'Test User',
      roleIds: props.roleIds || [],
      teamIds: props.teamIds || [],
      isActive: props.isActive !== undefined ? props.isActive : true,
    }, props.id ? new UniqueEntityID(props.id) : undefined);
  }

  /**
   * Skapar en mock Team-entitet med standardvärden.
   * 
   * @param props - Överskrivningsvärden för Team-objektet
   * @returns Result med Team-entiteten
   */
  static createMockTeam(props: Partial<{
    id: string;
    name: string;
    description: string;
    ownerId: string;
    members: TeamMember[];
    settings: { maxMembers?: number; isPrivate?: boolean };
  }> = {}): Result<Team> {
    const ownerId = props.ownerId || 'owner-1';
    const members = props.members || [];
    
    // Om ägaren inte redan finns bland medlemmarna, lägg till den
    if (!members.some(member => member.userId === ownerId)) {
      members.push({
        userId: ownerId,
        role: TeamRole.OWNER,
        joinedAt: new Date()
      });
    }
    
    return Team.create({
      name: props.name || 'Test Team',
      description: props.description || 'Test Team Description',
      ownerId: ownerId,
      members: members,
      settings: {
        maxMembers: props.settings?.maxMembers ?? 10,
        isPrivate: props.settings?.isPrivate ?? false
      }
    }, props.id ? new UniqueEntityID(props.id) : undefined);
  }

  /**
   * Skapar en mock Organization-entitet med standardvärden.
   * 
   * @param props - Överskrivningsvärden för Organization-objektet
   * @returns Result med Organization-entiteten
   */
  static createMockOrganization(props: Partial<{
    id: string;
    name: string;
    ownerId: string;
    teamIds: string[];
    settings: { maxMembers?: number; maxTeams?: number };
  }> = {}): Result<Organization> {
    return Organization.create({
      name: props.name || 'Test Organization',
      ownerId: props.ownerId || 'owner-1',
      teamIds: props.teamIds || [],
      settings: {
        maxMembers: props.settings?.maxMembers ?? 20,
        maxTeams: props.settings?.maxTeams ?? 5
      }
    }, props.id ? new UniqueEntityID(props.id) : undefined);
  }

  /**
   * Skapar en array med mock Team-entiteter.
   * 
   * @param count - Antal team att skapa
   * @param baseProps - Basvärden för alla team
   * @returns Array med Team-entiteter
   */
  static createMockTeams(count: number, baseProps: Partial<{
    namePrefix: string;
    ownerId: string;
  }> = {}): Team[] {
    const namePrefix = baseProps.namePrefix || 'Test Team';
    const ownerId = baseProps.ownerId || 'owner-1';
    
    return Array.from({ length: count }, (_, i) => {
      return this.createMockTeam({
        id: `team-${i + 1}`,
        name: `${namePrefix} ${i + 1}`,
        ownerId: ownerId
      }).value;
    });
  }

  /**
   * Skapar en array med mock User-entiteter.
   * 
   * @param count - Antal användare att skapa
   * @param baseProps - Basvärden för alla användare
   * @returns Array med User-entiteter
   */
  static createMockUsers(count: number, baseProps: Partial<{
    emailDomain: string;
    namePrefix: string;
  }> = {}): User[] {
    const emailDomain = baseProps.emailDomain || 'example.com';
    const namePrefix = baseProps.namePrefix || 'Test User';
    
    return Array.from({ length: count }, (_, i) => {
      return this.createMockUser({
        id: `user-${i + 1}`,
        email: `user${i + 1}@${emailDomain}`,
        name: `${namePrefix} ${i + 1}`
      }).value;
    });
  }

  /**
   * Skapar en mock TeamMember.
   * 
   * @param props - Egenskaper för TeamMember
   * @returns Ett TeamMember-objekt
   */
  static createMockTeamMember(props: Partial<{
    userId: string;
    role: TeamRole;
    joinedAt: Date;
  }> = {}): TeamMember {
    return {
      userId: props.userId || `user-${Math.floor(Math.random() * 1000)}`,
      role: props.role || TeamRole.MEMBER,
      joinedAt: props.joinedAt || new Date()
    };
  }

  /**
   * Skapar en array med mock TeamMember-objekt.
   * 
   * @param count - Antal medlemmar att skapa
   * @param baseProps - Basvärden för alla medlemmar
   * @returns Array med TeamMember-objekt
   */
  static createMockTeamMembers(count: number, baseProps: Partial<{
    userIdPrefix: string;
    role: TeamRole;
  }> = {}): TeamMember[] {
    const userIdPrefix = baseProps.userIdPrefix || 'user';
    const role = baseProps.role || TeamRole.MEMBER;
    
    return Array.from({ length: count }, (_, i) => {
      return this.createMockTeamMember({
        userId: `${userIdPrefix}-${i + 1}`,
        role: role
      });
    });
  }
} 