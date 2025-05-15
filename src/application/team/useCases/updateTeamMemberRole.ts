import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';

export interface UpdateTeamMemberRoleDTO {
  teamId: string;
  userId: string;
  newRole: TeamRole;
  updatedByUserId: string;
}

export interface UpdateTeamMemberRoleResponse {
  success: boolean;
  previousRole?: string;
  newRole: string;
}

type UpdateTeamMemberRoleError = { 
  message: string; 
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR' 
};

export class UpdateTeamMemberRoleUseCase {
  constructor(
    private teamRepository: TeamRepository,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(dto: UpdateTeamMemberRoleDTO): Promise<Result<UpdateTeamMemberRoleResponse, UpdateTeamMemberRoleError>> {
    try {
      // Validera indata
      if (!dto.teamId || !dto.userId || !dto.newRole || !dto.updatedByUserId) {
        return err({
          message: 'Alla obligatoriska fält måste anges',
          code: 'VALIDATION_ERROR'
        });
      }

      // Validera roll
      if (!Object.values(TeamRole).includes(dto.newRole)) {
        return err({
          message: 'Ogiltig roll angiven',
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

      // Kontrollera behörighet för användaren som uppdaterar
      const updatedByUserId = new UniqueId(dto.updatedByUserId);
      if (!team.hasMemberPermission(updatedByUserId, TeamPermission.MANAGE_ROLES)) {
        return err({
          message: 'Du har inte behörighet att ändra roller',
          code: 'UNAUTHORIZED'
        });
      }

      // Hitta tidigare roll (för response)
      const member = team.members.find(m => m.userId.toString() === dto.userId);
      const previousRole = member ? member.role : undefined;

      // Uppdatera roll
      const userId = new UniqueId(dto.userId);
      const updateResult = team.updateMemberRole(userId, dto.newRole);
      
      if (updateResult.isErr()) {
        return err({
          message: updateResult.error,
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

      return ok({ 
        success: true,
        previousRole: previousRole,
        newRole: dto.newRole
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 