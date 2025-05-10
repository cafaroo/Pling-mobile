import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';
import { MessageMention } from '../value-objects/MessageMention';

export class MessageMentionAdded extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly userId: UniqueId,
    public readonly mention: MessageMention
  ) {
    super({
      name: 'MessageMentionAdded',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        userId: userId.toString(),
        mentionData: {
          userId: mention.userId.toString(),
          index: mention.index,
          length: mention.length
        },
        timestamp: new Date().toISOString()
      }
    });
  }
} 