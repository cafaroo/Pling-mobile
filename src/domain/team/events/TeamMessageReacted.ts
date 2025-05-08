import { DomainEvent } from '@/domain/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';

export class TeamMessageReacted extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly emoji: string,
    public readonly reactedAt: Date
  ) {
    super({
      name: 'TeamMessageReacted',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        userId: userId.toString(),
        emoji,
        reactedAt: reactedAt.toISOString()
      }
    });
  }
} 