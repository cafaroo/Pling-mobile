import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/domain/core/UniqueId';
import { MessageAttachment } from '../value-objects/MessageAttachment';

export class MessageAttachmentAdded extends DomainEvent {
  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly attachment: MessageAttachment
  ) {
    super({
      name: 'MessageAttachmentAdded',
      payload: {
        messageId: messageId.toString(),
        teamId: teamId.toString(),
        attachmentData: {
          type: attachment.type,
          url: attachment.url,
          name: attachment.name,
          size: attachment.size,
          mimeType: attachment.mimeType
        },
        timestamp: new Date().toISOString()
      }
    });
  }
} 