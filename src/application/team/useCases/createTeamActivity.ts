import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';

// DTO för att skapa en aktivitet
export interface CreateTeamActivityDTO {
  teamId: string;
  performedBy: string;
  activityType: ActivityType;
  targetId?: string;
  metadata?: Record<string, any>;
}

export interface CreateTeamActivityResponse {
  success: boolean;
  activityId: string;
}

type CreateTeamActivityError = { 
  message: string; 
  code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR' 
};

/**
 * Användarfall för att skapa en teamaktivitet
 * 
 * Refaktorerad för att följa samma mönster som övriga use cases.
 */
export class CreateTeamActivityUseCase {
  constructor(
    private readonly teamActivityRepository: TeamActivityRepository,
    private readonly teamRepository: TeamRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}
  
  /**
   * Skapar en ny teamaktivitet
   */
  async execute(dto: CreateTeamActivityDTO): Promise<Result<CreateTeamActivityResponse, CreateTeamActivityError>> {
    try {
      // Validera indata
      if (!dto.teamId || !dto.performedBy || !dto.activityType) {
        return err({
          message: 'Team-ID, utförare och aktivitetstyp måste anges',
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Validera om teamet existerar
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
      
      // Skapa aktivitet
      const activityResult = TeamActivity.create({
        teamId: teamId,
        performedBy: new UniqueId(dto.performedBy),
        activityType: dto.activityType,
        targetId: dto.targetId ? new UniqueId(dto.targetId) : undefined,
        metadata: dto.metadata || {}
      });
      
      if (activityResult.isErr()) {
        return err({
          message: `Kunde inte skapa aktivitet: ${activityResult.error}`,
          code: 'VALIDATION_ERROR'
        });
      }
      
      const activity = activityResult.value;
      
      // Spara aktiviteten
      const saveResult = await this.teamActivityRepository.save(activity);
      
      if (saveResult.isErr()) {
        return err({
          message: `Kunde inte spara aktivitet: ${saveResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }
      
      return ok({
        success: true,
        activityId: activity.id.toString()
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
  
  /**
   * Skapar en aktivitet från en domänhändelse
   * Detta är en hjälpfunktion för att automatisera aktivitetsloggning från domänhändelser
   */
  async createFromDomainEvent(
    teamId: string,
    performedBy: string,
    eventName: string,
    eventPayload: Record<string, any>
  ): Promise<Result<CreateTeamActivityResponse, CreateTeamActivityError>> {
    try {
      // Validera indata
      if (!teamId || !performedBy || !eventName) {
        return err({
          message: 'Team-ID, utförare och händelsenamn måste anges',
          code: 'VALIDATION_ERROR'
        });
      }

      // Mappa domänhändelsenamn till aktivitetstyp
      let activityType: ActivityType;
      
      switch (eventName) {
        case 'TeamCreated':
          activityType = ActivityType.TEAM_CREATED;
          break;
          
        case 'TeamUpdated':
          activityType = ActivityType.TEAM_UPDATED;
          break;
          
        case 'MemberJoined':
          activityType = ActivityType.MEMBER_JOINED;
          break;
          
        case 'MemberLeft':
          activityType = ActivityType.MEMBER_LEFT;
          break;
          
        case 'TeamMemberRoleChanged':
          activityType = ActivityType.ROLE_CHANGED;
          break;
          
        case 'InvitationSent':
          activityType = ActivityType.INVITATION_SENT;
          break;
          
        case 'InvitationAccepted':
          activityType = ActivityType.INVITATION_ACCEPTED;
          break;
          
        case 'InvitationDeclined':
          activityType = ActivityType.INVITATION_DECLINED;
          break;
          
        default:
          activityType = ActivityType.CUSTOM_ACTION;
          break;
      }
      
      // Hitta eventuell targetId från eventet
      let targetId = undefined;
      if (eventPayload.userId) {
        targetId = eventPayload.userId;
      }
      
      // Skapa DTO
      const dto: CreateTeamActivityDTO = {
        teamId,
        performedBy,
        activityType,
        targetId,
        metadata: {
          ...eventPayload,
          domainEvent: eventName
        }
      };
      
      return this.execute(dto);
    } catch (error) {
      return err({
        message: `Kunde inte skapa aktivitet från händelse: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 