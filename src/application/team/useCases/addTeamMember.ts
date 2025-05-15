import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { TeamMember } from '@/domain/team/value-objects/TeamMember';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';

export interface AddTeamMemberDTO {
  teamId: string;
  userId: string;
  role: TeamRole;
  addedByUserId: string;
}

export interface AddTeamMemberResponse {
  success: boolean;
}

type AddTeamMemberError = { 
  message: string; 
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR' 
};

export class AddTeamMemberUseCase {
  constructor(
    private teamRepository: TeamRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(dto: AddTeamMemberDTO): Promise<Result<AddTeamMemberResponse, AddTeamMemberError>> {
    try {
      // Validera indata
      if (!dto.teamId || !dto.userId || !dto.addedByUserId) {
        return err({
          message: 'Alla obligatoriska fält måste anges',
          code: 'VALIDATION_ERROR'
        });
      }

      // Hämta team från repository
      const teamId = new UniqueId(dto.teamId);
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err({
          message: `Kunde inte hämta team: ${teamResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }
      
      const team = teamResult.value;
      
      if (!team) {
        return err({
          message: 'Team hittades inte',
          code: 'NOT_FOUND'
        });
      }

      // Kontrollera behörighet för användaren som lägger till
      const addedByUserId = new UniqueId(dto.addedByUserId);
      if (!team.hasMemberPermission(addedByUserId, TeamPermission.INVITE)) {
        return err({
          message: 'Du har inte behörighet att lägga till medlemmar',
          code: 'UNAUTHORIZED'
        });
      }

      // Skapa och lägg till medlemmen
      const memberResult = TeamMember.create({
        userId: new UniqueId(dto.userId),
        role: dto.role,
        joinedAt: new Date()
      });

      if (memberResult.isErr()) {
        return err({
          message: memberResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      const addResult = team.addMember(memberResult.value);
      if (addResult.isErr()) {
        return err({
          message: addResult.error,
          code: 'VALIDATION_ERROR'
        });
      }

      // Spara uppdaterat team
      const saveResult = await this.teamRepository.save(team);
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte spara team: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }

      // Publicera domänevents
      const domainEvents = team.getDomainEvents();
      await this.eventPublisher.publishAll(domainEvents);
      
      // Rensa händelser efter publicering
      team.clearEvents();

      return ok({ success: true });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 