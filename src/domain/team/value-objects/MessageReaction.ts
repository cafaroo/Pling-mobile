import { ValueObject } from '@/domain/core/ValueObject';
import { Result } from '@/domain/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';

export interface MessageReactionProps {
  emoji: string;
  userIds: UniqueId[];
}

export class MessageReaction extends ValueObject<MessageReactionProps> {
  get emoji(): string {
    return this.props.emoji;
  }

  get userIds(): UniqueId[] {
    return [...this.props.userIds];
  }

  get count(): number {
    return this.props.userIds.length;
  }

  private constructor(props: MessageReactionProps) {
    super(props);
  }

  public static create(props: MessageReactionProps): Result<MessageReaction, string> {
    if (!props.emoji || props.emoji.trim().length === 0) {
      return Result.err('Emoji krävs för reaktioner');
    }

    if (!props.userIds || props.userIds.length === 0) {
      return Result.err('Minst en användare måste vara kopplad till reaktionen');
    }

    // Deduplicate userIds
    const uniqueUserIds = props.userIds.filter(
      (userId, index, self) => 
        self.findIndex(u => u.equals(userId)) === index
    );

    return Result.ok(new MessageReaction({
      emoji: props.emoji.trim(),
      userIds: uniqueUserIds
    }));
  }

  /**
   * Lägger till en användare till reaktionen
   */
  public addUserId(userId: UniqueId): Result<void, string> {
    // Kontrollera om användaren redan finns
    if (this.props.userIds.some(id => id.equals(userId))) {
      return Result.err('Användaren har redan reagerat med denna emoji');
    }

    this.props.userIds.push(userId);
    return Result.ok();
  }

  /**
   * Tar bort en användare från reaktionen
   */
  public removeUserId(userId: UniqueId): Result<void, string> {
    const initialLength = this.props.userIds.length;
    
    this.props.userIds = this.props.userIds.filter(id => !id.equals(userId));
    
    if (this.props.userIds.length === initialLength) {
      return Result.err('Användaren har inte reagerat med denna emoji');
    }
    
    return Result.ok();
  }

  /**
   * Kontrollerar om en användare har reagerat
   */
  public hasUser(userId: UniqueId): boolean {
    return this.props.userIds.some(id => id.equals(userId));
  }

  /**
   * Slår ihop två reaktioner med samma emoji
   */
  public merge(other: MessageReaction): Result<MessageReaction, string> {
    if (this.emoji !== other.emoji) {
      return Result.err('Kan bara slå ihop reaktioner med samma emoji');
    }

    const combinedUserIds = [...this.userIds];
    
    // Lägg till användare från den andra reaktionen om de inte redan finns
    for (const otherUserId of other.userIds) {
      if (!combinedUserIds.some(id => id.equals(otherUserId))) {
        combinedUserIds.push(otherUserId);
      }
    }

    return MessageReaction.create({
      emoji: this.emoji,
      userIds: combinedUserIds
    });
  }
} 