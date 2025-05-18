/**
 * MockTeamRepository
 * 
 * Mockat repository för Team-entiteten som används i tester
 */

import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';

export class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();
  private teamsByOrgId: Map<string, Team[]> = new Map();
  private savedTeams: Team[] = [];

  /**
   * Återställer mocken till ursprungligt tillstånd
   */
  reset(): void {
    this.teams.clear();
    this.teamsByOrgId.clear();
    this.savedTeams = [];
  }

  /**
   * Lägger till ett team i mocken
   */
  addTeam(team: Team): void {
    this.teams.set(team.id.toString(), team);
  }

  /**
   * Lägger till flera teams i mocken
   */
  addTeams(teams: Team[]): void {
    teams.forEach(team => this.addTeam(team));
  }

  /**
   * Hämtar alla sparade teams
   */
  getSavedTeams(): Team[] {
    return [...this.savedTeams];
  }

  /**
   * Hittar ett team baserat på ID
   */
  async findById(id: string): Promise<Result<Team, Error>> {
    const team = this.teams.get(id);
    if (!team) {
      return err(new Error(`Team med ID ${id} hittades inte`));
    }
    return ok(team);
  }

  /**
   * Hittar team som tillhör en organisation
   */
  async findByOrganizationId(organizationId: string): Promise<Result<Team[], Error>> {
    const teams = this.teamsByOrgId.get(organizationId) || [];
    return ok(teams);
  }

  /**
   * Hittar team en användare är medlem i
   */
  async findByUserId(userId: string): Promise<Result<Team[], Error>> {
    const teams = Array.from(this.teams.values()).filter(team => {
      return team.members.some(member => {
        const memberId = typeof member.userId === 'string' 
          ? member.userId 
          : member.userId?.toString();
        return memberId === userId;
      });
    });
    return ok(teams);
  }

  /**
   * Hittar team baserat på sökterm
   */
  async search(term: string): Promise<Result<Team[], Error>> {
    if (!term) {
      return ok([]);
    }

    const lowercaseTerm = term.toLowerCase();
    const results = Array.from(this.teams.values()).filter(team => {
      return team.name.toLowerCase().includes(lowercaseTerm);
    });

    return ok(results);
  }

  /**
   * Hittar alla team
   */
  async findAll(): Promise<Result<Team[], Error>> {
    return ok(Array.from(this.teams.values()));
  }

  /**
   * Spara ett team (skapa eller uppdatera)
   */
  async save(team: Team): Promise<Result<Team, Error>> {
    if (!team || !team.id) {
      return err(new Error('Kan inte spara team: Ogiltigt Team-objekt eller saknat ID'));
    }
    
    const teamIdStr = team.id instanceof UniqueId 
      ? team.id.toString() 
      : String(team.id);
      
    this.teams.set(teamIdStr, team);
    this.savedTeams.push(team);
    
    // Indexera team per organisationsID
    if (team.organizationId) {
      const orgId = team.organizationId instanceof UniqueId 
        ? team.organizationId.toString() 
        : String(team.organizationId);
        
      if (!this.teamsByOrgId.has(orgId)) {
        this.teamsByOrgId.set(orgId, []);
      }
      
      // Ta bort eventuell tidigare version av teamet
      const teamsForOrg = this.teamsByOrgId.get(orgId) || [];
      const filteredTeams = teamsForOrg.filter(t => {
        const tId = t.id instanceof UniqueId ? t.id.toString() : String(t.id);
        return tId !== teamIdStr;
      });
      
      // Lägg till teamet i listan för organisationen
      filteredTeams.push(team);
      this.teamsByOrgId.set(orgId, filteredTeams);
    }
    
    return ok(team);
  }

  /**
   * Radera ett team
   */
  async delete(teamId: string | UniqueId): Promise<Result<void, Error>> {
    const teamIdStr = teamId instanceof UniqueId ? teamId.toString() : teamId;
    const team = this.teams.get(teamIdStr);
    
    if (!team) {
      return err(new Error(`Team med ID ${teamIdStr} hittades inte`));
    }
    
    // Ta bort från organisationsindex
    if (team.organizationId) {
      const orgId = team.organizationId instanceof UniqueId 
        ? team.organizationId.toString() 
        : String(team.organizationId);
        
      if (this.teamsByOrgId.has(orgId)) {
        const teamsForOrg = this.teamsByOrgId.get(orgId) || [];
        const filteredTeams = teamsForOrg.filter(t => {
          const tId = t.id instanceof UniqueId ? t.id.toString() : String(t.id);
          return tId !== teamIdStr;
        });
        
        this.teamsByOrgId.set(orgId, filteredTeams);
      }
    }
    
    this.teams.delete(teamIdStr);
    return ok(undefined);
  }

  /**
   * Mock-implementation av findByName
   */
  async findByName(name: string): Promise<Result<Team[], Error>> {
    const matchingTeams = Array.from(this.teams.values())
      .filter(team => team.name.toLowerCase().includes(name.toLowerCase()));
    
    return ok(matchingTeams);
  }

  /**
   * Mock-implementation av findByMemberId
   */
  async findByMemberId(userId: string): Promise<Result<Team[], Error>> {
    const matchingTeams = Array.from(this.teams.values())
      .filter(team => team.isMember(userId));
    
    return ok(matchingTeams);
  }

  /**
   * Mock-implementation av getAll
   */
  async getAll(): Promise<Result<Team[], Error>> {
    return ok(Array.from(this.teams.values()));
  }

  /**
   * Mock-implementation som simulerar ett databasfel
   */
  triggerError(methodName: string): void {
    this[methodName as keyof MockTeamRepository] = async () => {
      return err(new Error('Simulerat databasfel'));
    };
  }

  /**
   * Metodmetod som gör mockingen möjlig
   */
  mockAddTeam(team: Team): void {
    if (!team || !team.id) {
      throw new Error('Kan inte lägga till team: Ogiltigt Team-objekt eller saknat ID');
    }
    
    const teamIdStr = team.id instanceof UniqueId 
      ? team.id.toString() 
      : String(team.id);
      
    this.teams.set(teamIdStr, team);
    
    // Indexera team per organisationsID
    if (team.organizationId) {
      const orgId = team.organizationId instanceof UniqueId 
        ? team.organizationId.toString() 
        : String(team.organizationId);
        
      if (!this.teamsByOrgId.has(orgId)) {
        this.teamsByOrgId.set(orgId, []);
      }
      
      const teamsForOrg = this.teamsByOrgId.get(orgId) || [];
      teamsForOrg.push(team);
      this.teamsByOrgId.set(orgId, teamsForOrg);
    }
  }
}

// Exportera en factory-funktion för enkel användning
export const createMockTeamRepository = (): MockTeamRepository => {
  return new MockTeamRepository();
}; 