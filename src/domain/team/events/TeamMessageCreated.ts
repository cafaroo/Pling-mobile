import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { MessageAttachment } from '../value-objects/MessageAttachment';
import { MessageMention } from '../value-objects/MessageMention';

export class TeamMessageCreated implements IDomainEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;

  constructor(
    public readonly messageId: UniqueId,
    public readonly teamId: UniqueId,
    public readonly senderId: UniqueId,
    public readonly content: string,
    public readonly attachments: MessageAttachment[],
    public readonly mentions: MessageMention[],
    public readonly createdAt: Date
  ) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = 'TeamMessageCreated';
    this.aggregateId = teamId.toString();
  }
} 