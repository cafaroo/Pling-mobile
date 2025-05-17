import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { Team } from '@/domain/team/entities/Team';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';

export interface CreateTeamDTO {
  name: string;
  description?: string;
  ownerId: string;
}

export interface CreateTeamResponse {
  teamId: string;
  name: string;
  ownerId: string;
}

type CreateTeamError = { 
  message: string; 
  code: 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR'
};

interface Dependencies {
  teamRepo: TeamRepository;
  eventPublisher: IDomainEventPublisher;
}

/**
 * En mock implementation av IDomainEventPublisher för bakåtkompatibilitet 
 * när endast TeamRepository tillhandahålls i constructor
 */
class MockEventPublisher implements IDomainEventPublisher {
  async publish(event: any): Promise<void> {
    // No-op för bakåtkompatibilitet
    console.log('MockEventPublisher publishing:', event);
  }
}

export class CreateTeamUseCase {
  private teamRepository: TeamRepository;
  private eventPublisher: IDomainEventPublisher;

  constructor(
    teamRepository: TeamRepository,
    eventPublisher?: IDomainEventPublisher
  ) {
    this.teamRepository = teamRepository;
    this.eventPublisher = eventPublisher || new MockEventPublisher();
  }

  async execute(dto: CreateTeamDTO): Promise<Result<CreateTeamResponse, CreateTeamError>> {
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

      // Skapa team med den förbättrade domänmodellen
      const teamResult = Team.create({
        name: dto.name,
        description: dto.description,
        ownerId: dto.ownerId instanceof UniqueId ? dto.ownerId : new UniqueId(dto.ownerId)
      });

      if (teamResult.isErr()) {
        return err({
          message: teamResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      const team = teamResult.value;

      // Säkerställ att ägaren är medlem i teamet med OWNER-roll
      const ownerIdObj = dto.ownerId instanceof UniqueId ? dto.ownerId : new UniqueId(dto.ownerId);
      if (!team.isMember(ownerIdObj)) {
        const addOwnerResult = team.addMember(ownerIdObj, TeamRole.OWNER);
        if (addOwnerResult.isErr()) {
          return err({
            message: `Ägaren måste vara medlem i teamet med OWNER-roll`,
            code: 'VALIDATION_ERROR'
          });
        }
      }

      // Spara team
      const saveResult = await this.teamRepository.save(team);
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte spara team: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      // Publicera alla domänhändelser från aggregatroten
      const domainEvents = team.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventPublisher.publish(event);
      }
      
      // Rensa händelser efter publicering
      team.clearEvents();

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