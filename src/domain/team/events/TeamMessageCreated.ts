import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';
import { MessageAttachment } from '../value-objects/MessageAttachment';
import { MessageMention } from '../value-objects/MessageMention';

export class TeamMessageCreated extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly senderId: UniqueId,
    public readonly content: string,
    public readonly attachments: MessageAttachment[],
    public readonly mentions: MessageMention[],
    public readonly createdAt: Date
  ) {
    super({
      name: 'TeamMessageCreated',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        senderId: senderId.toString(),
        content,
        attachments: attachments.map(a => ({
          type: a.type,
          url: a.url,
          name: a.name,
          size: a.size,
          mimeType: a.mimeType
        })),
        mentions: mentions.map(m => ({
          userId: m.userId.toString(),
          index: m.index,
          length: m.length
        })),
        createdAt: createdAt.toISOString()
      }
    });
  }
} 