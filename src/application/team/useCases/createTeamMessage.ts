import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMessage, MessageAttachmentData, MessageMentionData } from '@/domain/team/entities/TeamMessage';
import { TeamMessageRepository } from '@/domain/team/repositories/TeamMessageRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';

export interface CreateTeamMessageDTO {
  teamId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
  parentId?: string;
}

export interface CreateTeamMessageResponse {
  messageId: string;
  teamId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  parentId?: string;
}

type CreateTeamMessageError = {
  message: string;
  code: 'VALIDATION_ERROR' | 'NOT_TEAM_MEMBER' | 'TEAM_NOT_FOUND' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  teamMessageRepository: TeamMessageRepository;
  teamRepository: TeamRepository;
  eventPublisher: IDomainEventPublisher;
}

export class CreateTeamMessageUseCase {
  constructor(
    private readonly teamMessageRepository: TeamMessageRepository,
    private readonly teamRepository: TeamRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): CreateTeamMessageUseCase {
    return new CreateTeamMessageUseCase(
      deps.teamMessageRepository,
      deps.teamRepository,
      deps.eventPublisher
    );
  }

  async execute(dto: CreateTeamMessageDTO): Promise<Result<CreateTeamMessageResponse, CreateTeamMessageError>> {
    try {
      // Validera att teamet finns
      const teamId = new UniqueId(dto.teamId);
      const senderIdObj = new UniqueId(dto.senderId);
      
      const teamResult = await this.teamRepository.findById(teamId);
      if (teamResult.isErr()) {
        return err({
          message: `Team hittades inte: ${teamResult.error}`,
          code: 'TEAM_NOT_FOUND'
        });
      }
      
      const team = teamResult.value;
      
      // Kontrollera att avsändaren är medlem i teamet
      if (!team.isMember(senderIdObj)) {
        return err({
          message: 'Användaren är inte medlem i teamet',
          code: 'NOT_TEAM_MEMBER'
        });
      }
      
      // Validera att innehållet inte är tomt
      if (!dto.content || dto.content.trim().length === 0) {
        return err({
          message: 'Meddelandeinnehåll kan inte vara tomt',
          code: 'VALIDATION_ERROR'
        });
      }
      
      // Skapa meddelande
      const messageResult = TeamMessage.create({
        id: undefined,
        teamId: team.id.toString(),
        senderId: dto.senderId,
        content: dto.content,
        attachments: dto.attachments || [],
        mentions: dto.mentions || [],
        parentId: dto.parentId
      });
      
      if (messageResult.isErr()) {
        return err({
          message: messageResult.error,
          code: 'VALIDATION_ERROR'
        });
      }
      
      const message = messageResult.value;
      
      // Spara meddelande i repository
      const savedResult = await this.teamMessageRepository.save(message);
      if (savedResult.isErr()) {
        return err({
          message: `Kunde inte spara meddelande: ${savedResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }
      
      // Publicera alla domänhändelser från aggregatroten
      const domainEvents = message.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventPublisher.publish(event);
      }
      
      // Rensa händelser efter publicering
      message.clearEvents();
      
      // Skapa och returnera response
      return ok({
        messageId: message.id.toString(),
        teamId: message.teamId.toString(),
        senderId: message.senderId.toString(),
        content: message.content,
        createdAt: message.createdAt,
        parentId: message.parentId?.toString()
      });
    } catch (error) {
      return err({
        message: `Ett fel uppstod vid skapande av meddelande: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 