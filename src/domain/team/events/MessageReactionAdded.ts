import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';

export class MessageReactionAdded extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly emoji: string
  ) {
    super({
      name: 'MessageReactionAdded',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        userId: userId.toString(),
        emoji: emoji,
        timestamp: new Date().toISOString()
      }
    });
  }
} 