import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamMessage, MessageAttachmentData, MessageMentionData } from '@/domain/team/entities/TeamMessage';
import { TeamMessageRepository } from '@/domain/team/repositories/TeamMessageRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
// Importera eventuella nödvändiga domänhändelser om de ska publiceras härifrån,
// t.ex. en specifik ThreadReplyCreatedEvent om den skiljer sig från TeamMessageCreated.

export interface CreateThreadReplyDTO {
  parentId: string;
  teamId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
}

export interface CreateThreadReplyResponse {
  messageId: string;
  parentId: string;
  teamId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

type CreateThreadReplyError = {
  message: string;
  code: 'VALIDATION_ERROR' | 'PARENT_MESSAGE_NOT_FOUND' | 'PARENT_MESSAGE_DELETED' | 'DATABASE_ERROR' | 'UNEXPECTED_ERROR';
};

interface Dependencies {
  teamMessageRepository: TeamMessageRepository;
  eventPublisher: IDomainEventPublisher;
}

export class CreateThreadReplyUseCase {
  constructor(
    private readonly teamMessageRepository: TeamMessageRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  static create(deps: Dependencies): CreateThreadReplyUseCase {
    return new CreateThreadReplyUseCase(
      deps.teamMessageRepository,
      deps.eventPublisher
    );
  }

  async execute(dto: CreateThreadReplyDTO): Promise<Result<CreateThreadReplyResponse, CreateThreadReplyError>> {
    try {
      // 1. Validera input
      if (!dto.parentId) {
        return err({
          message: 'Parent ID (meddelandet som svaras på) måste anges',
          code: 'VALIDATION_ERROR'
        });
      }
      
      if (!dto.content || dto.content.trim().length === 0) {
        return err({
          message: 'Svarets innehåll kan inte vara tomt',
          code: 'VALIDATION_ERROR'
        });
      }

      const parentId = new UniqueId(dto.parentId);

      // 2. Hämta och validera föräldrameddelandet
      const parentMessageResult = await this.teamMessageRepository.findById(parentId);
      if (parentMessageResult.isErr()) {
        return err({
          message: `Kunde inte hitta originalmeddelandet: ${parentMessageResult.error}`,
          code: 'PARENT_MESSAGE_NOT_FOUND'
        });
      }
      
      const parentMessage = parentMessageResult.value;

      if (parentMessage.isDeleted) {
        return err({
          message: 'Kan inte svara på ett raderat meddelande',
          code: 'PARENT_MESSAGE_DELETED'
        });
      }

      // 3. Skapa det nya svarsmeddelandet
      const replyMessageResult = TeamMessage.create({
        teamId: dto.teamId,
        senderId: dto.senderId,
        content: dto.content,
        parentId: parentId.toString(),
        attachments: dto.attachments || [],
        mentions: dto.mentions || []
      });

      if (replyMessageResult.isErr()) {
        return err({
          message: replyMessageResult.error,
          code: 'VALIDATION_ERROR'
        });
      }
      
      const newReplyMessage = replyMessageResult.value;

      // 4. Spara det nya svarsmeddelandet
      const saveReplyResult = await this.teamMessageRepository.save(newReplyMessage);
      if (saveReplyResult.isErr()) {
        return err({
          message: `Kunde inte spara svaret: ${saveReplyResult.error}`,
          code: 'DATABASE_ERROR'
        });
      }
      
      const savedReply = saveReplyResult.value;

      // 5. Uppdatera föräldrameddelandets trådinformation
      parentMessage.incrementReplyCount(savedReply.createdAt);
      
      const updateParentResult = await this.teamMessageRepository.save(parentMessage);
      if (updateParentResult.isErr()) {
        console.error(`Kunde inte uppdatera trådinfo på föräldrameddelande ${parentId.toString()}: ${updateParentResult.error}`);
        // Trots fel med föräldrauppdatering fortsätter vi, eftersom svaret är sparat
      } else {
        // Publicera domänevents från det uppdaterade föräldrameddelandet
        const parentEvents = parentMessage.getDomainEvents();
        for (const event of parentEvents) {
          await this.eventPublisher.publish(event);
        }
        parentMessage.clearEvents();
      }
      
      // Publicera domänevents från svarsmeddelandet
      const replyEvents = savedReply.getDomainEvents();
      for (const event of replyEvents) {
        await this.eventPublisher.publish(event);
      }
      savedReply.clearEvents();

      return ok({
        messageId: savedReply.id.toString(),
        parentId: savedReply.parentId.toString(),
        teamId: savedReply.teamId.toString(),
        senderId: savedReply.senderId.toString(),
        content: savedReply.content,
        createdAt: savedReply.createdAt
      });
    } catch (error) {
      return err({
        message: `Ett oväntat fel inträffade: ${error instanceof Error ? error.message : String(error)}`,
        code: 'UNEXPECTED_ERROR'
      });
    }
  }
} 