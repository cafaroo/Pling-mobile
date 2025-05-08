import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';

export class TeamMessageDeleted extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly senderId: UniqueId,
    public readonly deletedAt: Date
  ) {
    super({
      name: 'TeamMessageDeleted',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        senderId: senderId.toString(),
        deletedAt: deletedAt.toISOString()
      }
    });
  }
} 