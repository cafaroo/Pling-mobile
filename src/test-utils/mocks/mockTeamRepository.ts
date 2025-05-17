/**
 * MockTeamRepository
 * 
 * Mockat repository för Team-entiteten som används i tester
 */

import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { Result, ok, err } from '@/shared/core/Result';

export class MockTeamRepository implements TeamRepository {
  private teams: Map<string, Team> = new Map();
  private savedTeams: Team[] = [];

  /**
   * Återställer mocken till ursprungligt tillstånd
   */
  reset(): void {
    this.teams.clear();
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
   * Mock-implementation av findById
   */
  async findById(id: string): Promise<Result<Team, Error>> {
    const team = this.teams.get(id);
    
    if (!team) {
      return err(new Error(`Team med ID ${id} hittades inte`));
    }
    
    return ok(team);
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
   * Mock-implementation av findByOrganizationId
   */
  async findByOrganizationId(organizationId: string): Promise<Result<Team[], Error>> {
    const matchingTeams = Array.from(this.teams.values())
      .filter(team => team.organizationId === organizationId);
    
    return ok(matchingTeams);
  }

  /**
   * Mock-implementation av save
   */
  async save(team: Team): Promise<Result<Team, Error>> {
    this.teams.set(team.id.toString(), team);
    this.savedTeams.push(team);
    return ok(team);
  }

  /**
   * Mock-implementation av delete
   */
  async delete(id: string): Promise<Result<void, Error>> {
    if (!this.teams.has(id)) {
      return err(new Error(`Team med ID ${id} hittades inte`));
    }

    this.teams.delete(id);
    return ok(undefined);
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
}

// Exportera en factory-funktion för enkel användning
export const createMockTeamRepository = (): MockTeamRepository => {
  return new MockTeamRepository();
}; 