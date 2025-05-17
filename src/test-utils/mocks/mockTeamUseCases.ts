/**
 * Mockade implementationer av team-relaterade användningsfall
 */
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { createMockTeam, MockTeamRole } from './mockTeamEntities';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { EventBus } from '@/shared/core/EventBus';

export interface MockCreateTeamDTO {
  name: string;
  description?: string;
  ownerId: string;
}

export interface MockCreateTeamResponse {
  teamId: string;
  name: string;
  ownerId: string;
}

/**
 * En mock av CreateTeamUseCase för testning
 * som returnerar förväntade resultat för tester
 */
export class MockCreateTeamUseCase {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly eventPublisher?: any
  ) {}

  async execute(dto: MockCreateTeamDTO): Promise<Result<MockCreateTeamResponse, any>> {
    try {
      // Validera indata
      if (!dto.name || dto.name.trim().length < 2) {
        return err({
          message: 'Teamnamn måste vara minst 2 tecken',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!dto.ownerId) {
        return err({
          message: 'Ägar-ID är obligatoriskt',
          code: 'VALIDATION_ERROR'
        });
      }

      // Skapa team med mock-implementation
      const teamId = new UniqueId();
      const team = createMockTeam({
        name: dto.name,
        description: dto.description,
        ownerId: dto.ownerId
      });

      // Spara team i repository
      const saveResult = await this.teamRepository.save(team);
      
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte spara team: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      // Publicera event om eventPublisher finns
      if (this.eventPublisher) {
        try {
          const domainEvents = team.getDomainEvents();
          for (const event of domainEvents) {
            await this.eventPublisher.publish(event);
          }
          team.clearEvents();
        } catch (error) {
          console.warn('Kunde inte publicera team-händelser:', error);
        }
      }

      // Skapa och returnera response
      return ok({
        teamId: team.id.toString(),
        name: team.name,
        ownerId: team.ownerId.toString()
      });
    } catch (error) {
      return err({
        message: `Ett fel uppstod vid skapande av team: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
}

/**
 * En mock av UpdateTeamUseCase för testning som returnerar 
 * förväntade resultat för tester
 */
export class MockUpdateTeamUseCase {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly eventPublisher?: EventBus
  ) {}

  async execute(input: {
    teamId: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    settings?: any;
  }): Promise<Result<any, Error>> {
    try {
      // Validera input
      if (input.name && input.name.trim().length < 2) {
        return err(new Error('Ogiltigt teamnamn'));
      }

      // Hämta team
      const teamResult = await this.teamRepository.findById(new UniqueId(input.teamId));
      if (teamResult.isErr()) {
        return err(new Error('Team hittades inte'));
      }

      const team = teamResult.value;

      // Uppdatera team
      if (input.name) {
        team.name = input.name;
      }

      if (input.description !== undefined) {
        team.description = input.description;
      }

      if (input.settings) {
        team.settings = {
          ...team.settings,
          ...input.settings
        };
      }

      team.updatedAt = new Date();

      // Spara team
      const saveResult = await this.teamRepository.save(team);
      if (saveResult.isErr()) {
        return err(new Error(`Kunde inte uppdatera team: ${saveResult.error}`));
      }

      // Publicera event
      if (this.eventPublisher) {
        this.eventPublisher.publish({
          eventType: 'TeamUpdatedEvent',
          teamId: team.id.toString(),
          updatedFields: Object.keys(input).filter(key => key !== 'teamId')
        });
      }

      return ok(team);
    } catch (error) {
      return err(new Error('Ett oväntat fel inträffade'));
    }
  }
} 