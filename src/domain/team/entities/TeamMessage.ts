import { AggregateRoot, AggregateRootProps } from '@/domain/core/AggregateRoot';
import { Result } from '@/domain/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';
import { MessageAttachment } from '../value-objects/MessageAttachment';
import { MessageMention } from '../value-objects/MessageMention';
import { MessageReaction } from '../value-objects/MessageReaction';
import { TeamMessageCreated } from '../events/TeamMessageCreated';
import { TeamMessageEdited } from '../events/TeamMessageEdited';
import { TeamMessageDeleted } from '../events/TeamMessageDeleted';
import { TeamMessageReacted } from '../events/TeamMessageReacted';

export interface TeamMessageProps extends AggregateRootProps {
  teamId: UniqueId;
  senderId: UniqueId;
  content: string;
  attachments: MessageAttachment[];
  mentions: MessageMention[];
  reactions: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  parentId?: UniqueId | null;
  threadReplyCount: number;
  lastReplyAt?: Date | null;
}

export interface CreateTeamMessageProps {
  id?: string;
  teamId: string;
  senderId: string;
  content: string;
  attachments?: MessageAttachmentData[];
  mentions?: MessageMentionData[];
  parentId?: string;
}

export interface MessageAttachmentData {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface MessageMentionData {
  userId: string;
  index: number;
  length: number;
}

export interface MessageReactionData {
  emoji: string;
  userId: string;
}

export class TeamMessage extends AggregateRoot<TeamMessageProps> {
  get teamId(): UniqueId {
    return this.props.teamId;
  }

  get senderId(): UniqueId {
    return this.props.senderId;
  }

  get content(): string {
    return this.props.content;
  }

  get attachments(): MessageAttachment[] {
    return [...this.props.attachments];
  }

  get mentions(): MessageMention[] {
    return [...this.props.mentions];
  }

  get reactions(): MessageReaction[] {
    return [...this.props.reactions];
  }

  get isEdited(): boolean {
    return this.props.isEdited;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  get parentId(): UniqueId | null | undefined {
    return this.props.parentId;
  }

  get threadReplyCount(): number {
    return this.props.threadReplyCount;
  }

  get lastReplyAt(): Date | null | undefined {
    return this.props.lastReplyAt;
  }

  private constructor(props: TeamMessageProps) {
    super(props);
  }

  public static create(props: CreateTeamMessageProps): Result<TeamMessage, string> {
    try {
      if (!props.content || props.content.trim().length === 0) {
        return Result.err('Meddelande kan inte vara tomt');
      }

      if (props.content.length > 4000) {
        return Result.err('Meddelande kan inte vara längre än 4000 tecken');
      }

      const teamId = new UniqueId(props.teamId);
      const senderId = new UniqueId(props.senderId);
      const messageId = props.id ? new UniqueId(props.id) : UniqueId.create();
      const now = new Date();
      const parentId = props.parentId ? new UniqueId(props.parentId) : null;

      // Skapa attachments
      const attachmentResults = props.attachments?.map(a => 
        MessageAttachment.create({
          type: a.type,
          url: a.url,
          name: a.name,
          size: a.size,
          mimeType: a.mimeType
        })
      ) || [];

      const attachments = attachmentResults.map(r => r.unwrapOr(null)).filter(a => a !== null);

      // Skapa mentions
      const mentionResults = props.mentions?.map(m => 
        MessageMention.create({
          userId: new UniqueId(m.userId),
          index: m.index,
          length: m.length
        })
      ) || [];

      const mentions = mentionResults.map(r => r.unwrapOr(null)).filter(m => m !== null);

      const message = new TeamMessage({
        id: messageId,
        teamId,
        senderId,
        content: props.content.trim(),
        attachments,
        mentions,
        reactions: [],
        isEdited: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        parentId: parentId,
        threadReplyCount: 0,
        lastReplyAt: null
      });

      // Skapa domänhändelse
      message.addDomainEvent(new TeamMessageCreated(
        message.id,
        message.teamId,
        message.senderId,
        message.content,
        message.attachments,
        message.mentions,
        message.createdAt
      ));

      return Result.ok(message);
    } catch (error) {
      return Result.err(`Kunde inte skapa team-meddelande: ${error.message}`);
    }
  }

  public editContent(newContent: string): Result<void, string> {
    if (this.isDeleted) {
      return Result.err('Kan inte redigera ett raderat meddelande');
    }

    if (!newContent || newContent.trim().length === 0) {
      return Result.err('Meddelande kan inte vara tomt');
    }

    if (newContent.length > 4000) {
      return Result.err('Meddelande kan inte vara längre än 4000 tecken');
    }

    // Uppdatera innehåll
    this.props.content = newContent.trim();
    this.props.isEdited = true;
    this.props.updatedAt = new Date();

    // Skapa domänhändelse
    this.addDomainEvent(new TeamMessageEdited(
      this.id,
      this.teamId,
      this.senderId,
      this.content,
      this.updatedAt
    ));

    return Result.ok();
  }

  public markAsDeleted(): Result<void, string> {
    if (this.isDeleted) {
      return Result.err('Meddelande är redan raderat');
    }

    this.props.isDeleted = true;
    this.props.updatedAt = new Date();

    // Skapa domänhändelse
    this.addDomainEvent(new TeamMessageDeleted(
      this.id,
      this.teamId,
      this.senderId,
      this.updatedAt
    ));

    return Result.ok();
  }

  public addReaction(reaction: MessageReactionData): Result<void, string> {
    if (this.isDeleted) {
      return Result.err('Kan inte reagera på ett raderat meddelande');
    }

    // Skapa reaktion
    const userId = new UniqueId(reaction.userId);
    
    // Kontrollera om användaren redan har reagerat med denna emoji
    const existingReaction = this.props.reactions.find(r => 
      r.emoji === reaction.emoji && r.userIds.some(id => id.equals(userId))
    );

    if (existingReaction) {
      return Result.err('Användaren har redan reagerat med denna emoji');
    }

    // Hitta och uppdatera befintlig reaktion med samma emoji eller skapa ny
    const reactionToUpdate = this.props.reactions.find(r => r.emoji === reaction.emoji);
    
    if (reactionToUpdate) {
      // Lägg till användaren till befintlig reaktion
      reactionToUpdate.addUserId(userId);
    } else {
      // Skapa ny reaktion
      const reactionResult = MessageReaction.create({
        emoji: reaction.emoji,
        userIds: [userId]
      });

      if (reactionResult.isErr()) {
        return Result.err(reactionResult.unwrapErr());
      }

      this.props.reactions.push(reactionResult.unwrap());
    }

    this.props.updatedAt = new Date();

    // Skapa domänhändelse
    this.addDomainEvent(new TeamMessageReacted(
      this.id,
      this.teamId,
      userId,
      reaction.emoji,
      this.updatedAt
    ));

    return Result.ok();
  }

  public removeReaction(reaction: MessageReactionData): Result<void, string> {
    if (this.isDeleted) {
      return Result.err('Kan inte ta bort reaktion från ett raderat meddelande');
    }

    const userId = new UniqueId(reaction.userId);
    
    // Hitta reaktionen
    const reactionIndex = this.props.reactions.findIndex(r => 
      r.emoji === reaction.emoji && r.userIds.some(id => id.equals(userId))
    );

    if (reactionIndex === -1) {
      return Result.err('Reaktionen finns inte');
    }

    const reactionToUpdate = this.props.reactions[reactionIndex];
    
    // Ta bort användaren från reaktionen
    reactionToUpdate.removeUserId(userId);
    
    // Om ingen användare kvar, ta bort hela reaktionen
    if (reactionToUpdate.userIds.length === 0) {
      this.props.reactions.splice(reactionIndex, 1);
    }
    
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public addMention(mention: MessageMentionData): Result<void, string> {
    if (this.isDeleted) {
      return Result.err('Kan inte lägga till omnämnande i ett raderat meddelande');
    }

    const mentionResult = MessageMention.create({
      userId: new UniqueId(mention.userId),
      index: mention.index,
      length: mention.length
    });

    if (mentionResult.isErr()) {
      return Result.err(mentionResult.unwrapErr());
    }

    this.props.mentions.push(mentionResult.unwrap());
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public addAttachment(attachment: MessageAttachmentData): Result<void, string> {
    if (this.isDeleted) {
      return Result.err('Kan inte lägga till bilaga i ett raderat meddelande');
    }

    const attachmentResult = MessageAttachment.create({
      type: attachment.type,
      url: attachment.url,
      name: attachment.name,
      size: attachment.size,
      mimeType: attachment.mimeType
    });

    if (attachmentResult.isErr()) {
      return Result.err(attachmentResult.unwrapErr());
    }

    this.props.attachments.push(attachmentResult.unwrap());
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  public incrementReplyCount(replyTimestamp: Date): void {
    if (this.isDeleted) return;

    this.props.threadReplyCount += 1;
    this.props.lastReplyAt = replyTimestamp;
    this.props.updatedAt = new Date();
  }

  public decrementReplyCount(newLastReplyAt?: Date | null): void {
    if (this.isDeleted) return;

    if (this.props.threadReplyCount > 0) {
      this.props.threadReplyCount -= 1;
    }
    this.props.lastReplyAt = this.props.threadReplyCount === 0 ? null : (newLastReplyAt || this.props.lastReplyAt);
    this.props.updatedAt = new Date();
  }
} 