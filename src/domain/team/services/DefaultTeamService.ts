import { Result, ok, err } from '@/shared/core/Result';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamService } from './TeamService';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';

export class DefaultTeamService implements TeamService {
  private teamRepository: TeamRepository;
  private eventPublisher: IDomainEventPublisher;

  constructor(teamRepository: TeamRepository, eventPublisher: IDomainEventPublisher) {
    this.teamRepository = teamRepository;
    this.eventPublisher = eventPublisher;
  }

  async getTeamById(teamId: string): Promise<Result<Team, Error>> {
    try {
      const result = await this.teamRepository.findById(teamId);
      return result;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid hämtning av team'));
    }
  }

  async createTeam(data: {
    name: string;
    description?: string;
    ownerId: string;
    organizationId?: string;
  }): Promise<Result<Team, Error>> {
    try {
      const { name, description, ownerId, organizationId } = data;
      
      // Skapa teamet
      const createResult = Team.create({
        name,
        description,
        ownerId,
        organizationId,
        members: [],
        isActive: true
      });
      
      if (createResult.isErr()) {
        return err(new Error(`Kunde inte skapa team: ${createResult.error}`));
      }
      
      const team = createResult.value;
      
      // Lägg till ägaren som medlem med ägarroll
      const ownerMember = TeamMember.create({
        userId: ownerId,
        roles: [TeamRole.OWNER]
      });
      
      if (ownerMember.isErr()) {
        return err(new Error(`Kunde inte skapa teammedlem: ${ownerMember.error}`));
      }
      
      const addMemberResult = team.addMember(ownerMember.value);
      
      if (addMemberResult.isErr()) {
        return err(new Error(`Kunde inte lägga till ägare i team: ${addMemberResult.error}`));
      }
      
      // Spara teamet
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara team: ${saveResult.error}`));
      }
      
      return ok(team);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid skapande av team'));
    }
  }

  async updateTeam(teamId: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Result<Team, Error>> {
    try {
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(new Error(`Kunde inte hitta team: ${teamResult.error}`));
      }
      
      const team = teamResult.value;
      
      // Uppdatera teamet
      if (data.name) team.updateName(data.name);
      if (data.description !== undefined) team.updateDescription(data.description);
      if (data.isActive !== undefined) data.isActive ? team.activate() : team.deactivate();
      
      // Spara teamet
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara team: ${saveResult.error}`));
      }
      
      return ok(team);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid uppdatering av team'));
    }
  }

  async addMember(teamId: string, userId: string, roles: string[] = []): Promise<Result<Team, Error>> {
    try {
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(new Error(`Kunde inte hitta team: ${teamResult.error}`));
      }
      
      const team = teamResult.value;
      
      // Skapa medlemmen
      const member = TeamMember.create({
        userId,
        roles: roles.length > 0 ? roles : [TeamRole.MEMBER]
      });
      
      if (member.isErr()) {
        return err(new Error(`Kunde inte skapa teammedlem: ${member.error}`));
      }
      
      // Lägg till medlemmen i teamet
      const addResult = team.addMember(member.value);
      
      if (addResult.isErr()) {
        return err(new Error(`Kunde inte lägga till medlem i team: ${addResult.error}`));
      }
      
      // Spara teamet
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara team: ${saveResult.error}`));
      }
      
      return ok(team);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid tillägg av teammedlem'));
    }
  }

  async removeMember(teamId: string, userId: string): Promise<Result<Team, Error>> {
    try {
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(new Error(`Kunde inte hitta team: ${teamResult.error}`));
      }
      
      const team = teamResult.value;
      
      // Ta bort medlemmen från teamet
      const removeResult = team.removeMember(userId);
      
      if (removeResult.isErr()) {
        return err(new Error(`Kunde inte ta bort medlem från team: ${removeResult.error}`));
      }
      
      // Spara teamet
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara team: ${saveResult.error}`));
      }
      
      return ok(team);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid borttagning av teammedlem'));
    }
  }

  async updateMemberRoles(teamId: string, userId: string, roles: string[]): Promise<Result<Team, Error>> {
    try {
      // Hämta teamet
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(new Error(`Kunde inte hitta team: ${teamResult.error}`));
      }
      
      const team = teamResult.value;
      
      // Uppdatera medlemsroller
      const updateResult = team.updateMemberRoles(userId, roles);
      
      if (updateResult.isErr()) {
        return err(new Error(`Kunde inte uppdatera medlemsroller: ${updateResult.error}`));
      }
      
      // Spara teamet
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte spara team: ${saveResult.error}`));
      }
      
      return ok(team);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Okänt fel vid uppdatering av medlemsroller'));
    }
  }
} 