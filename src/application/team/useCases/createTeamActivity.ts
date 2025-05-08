import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UseCase } from '@/shared/core/UseCase';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

// DTO för att skapa en aktivitet
export interface CreateTeamActivityDTO {
  teamId: string;
  performedBy: string;
  activityType: ActivityType;
  targetId?: string;
  metadata?: Record<string, any>;
}

/**
 * Användarfall för att skapa en teamaktivitet
 */
export class CreateTeamActivityUseCase implements UseCase<CreateTeamActivityDTO, Result<string, string>> {
  constructor(
    private readonly activityRepository: TeamActivityRepository,
    private readonly teamRepository: TeamRepository
  ) {}
  
  /**
   * Skapar en ny teamaktivitet
   */
  async execute(dto: CreateTeamActivityDTO): Promise<Result<string, string>> {
    try {
      // Validera om teamet existerar
      const teamId = new UniqueId(dto.teamId);
      const teamResult = await this.teamRepository.findById(teamId);
      
      if (teamResult.isErr()) {
        return err(`Kunde inte skapa aktivitet: ${teamResult.error}`);
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
        return err(`Kunde inte skapa aktivitet: ${activityResult.error}`);
      }
      
      const activity = activityResult.getValue();
      
      // Spara aktiviteten
      const saveResult = await this.activityRepository.save(activity);
      
      if (saveResult.isErr()) {
        return err(`Kunde inte spara aktivitet: ${saveResult.error}`);
      }
      
      return ok(activity.id.toString());
    } catch (error) {
      return err(`Ett oväntat fel uppstod: ${error instanceof Error ? error.message : String(error)}`);
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
  ): Promise<Result<string, string>> {
    try {
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
          
        case 'RoleChanged':
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
      
      // Hitta eventuel targetId från eventet
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
      return err(`Kunde inte skapa aktivitet från händelse: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 