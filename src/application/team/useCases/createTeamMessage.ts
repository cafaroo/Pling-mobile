import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamMessage, CreateTeamMessageProps, MessageAttachmentData, MessageMentionData } from '@/domain/team/entities/TeamMessage';
import { TeamMessageRepository } from '@/domain/team/repositories/TeamMessageRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';

export interface CreateTeamMessageUseCasePayload {
  teamId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
}

export class CreateTeamMessageUseCase {
  constructor(
    private readonly teamMessageRepository: TeamMessageRepository,
    private readonly teamRepository: TeamRepository
  ) {}

  async execute(payload: CreateTeamMessageUseCasePayload): Promise<Result<TeamMessage, string>> {
    try {
      // Validera att teamet finns
      const teamId = new UniqueId(payload.teamId);
      const senderIdObj = new UniqueId(payload.senderId);
      
      const teamResult = await this.teamRepository.findById(teamId);
      if (teamResult.isErr()) {
        return err(teamResult.error);
      }
      
      const team = teamResult.value;
      
      // Kontrollera att avsändaren är medlem i teamet
      if (!team.isMember(senderIdObj)) {
        return err('Användaren är inte medlem i teamet');
      }
      
      // Validera att innehållet inte är tomt
      if (!payload.content || payload.content.trim().length === 0) {
        return err('Meddelandeinnehåll kan inte vara tomt');
      }
      
      // Skapa meddelande
      const messageResult = TeamMessage.create({
        id: undefined, // Kan vara undefined för att generera ett nytt
        teamId: team.id.toString(),
        senderId: payload.senderId,
        content: payload.content,
        attachments: payload.attachments || [],
        mentions: payload.mentions || [],
        parentId: undefined // Kan vara undefined för att generera ett nytt
      });
      
      if (messageResult.isErr()) {
        return err(messageResult.error);
      }
      const message = messageResult.value;
      
      // Spara meddelande i repository
      const savedResult = await this.teamMessageRepository.save(message);
      if (savedResult.isErr()) {
        return err(savedResult.error);
      }
      
      return ok(savedResult.value);
    } catch (error) {
      return err(`Ett fel uppstod vid skapande av meddelande: ${error.message}`);
    }
  }
} 