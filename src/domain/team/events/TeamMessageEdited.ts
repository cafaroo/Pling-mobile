import { DomainEvent } from '@/domain/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';

export class TeamMessageEdited extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly senderId: UniqueId,
    public readonly content: string,
    public readonly updatedAt: Date
  ) {
    super({
      name: 'TeamMessageEdited',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        senderId: senderId.toString(),
        content,
        updatedAt: updatedAt.toISOString()
      }
    });
  }
} 