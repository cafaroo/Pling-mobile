import { ValueObject } from '@/shared/core/ValueObject';
import { Result } from '@/domain/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';

export interface MessageMentionProps {
  userId: UniqueId;
  index: number;
  length: number;
}

export class MessageMention extends ValueObject<MessageMentionProps> {
  get userId(): UniqueId {
    return this.props.userId;
  }

  get index(): number {
    return this.props.index;
  }

  get length(): number {
    return this.props.length;
  }

  private constructor(props: MessageMentionProps) {
    super(props);
  }

  public static create(props: MessageMentionProps): Result<MessageMention, string> {
    if (!props.userId) {
      return Result.err('Användare ID krävs för omnämnanden');
    }

    if (props.index < 0) {
      return Result.err('Index måste vara ett positivt heltal');
    }

    if (props.length <= 0) {
      return Result.err('Längd måste vara större än 0');
    }

    return Result.ok(new MessageMention(props));
  }

  /**
   * Kontrollerar om denna omnämning överlappar med en annan omnämning
   */
  public overlaps(other: MessageMention): boolean {
    const thisStart = this.index;
    const thisEnd = this.index + this.length - 1;
    const otherStart = other.index;
    const otherEnd = other.index + other.length - 1;

    return (
      (thisStart <= otherStart && otherStart <= thisEnd) ||
      (thisStart <= otherEnd && otherEnd <= thisEnd) ||
      (otherStart <= thisStart && thisStart <= otherEnd) ||
      (otherStart <= thisEnd && thisEnd <= otherEnd)
    );
  }

  /**
   * Extraherar omnämnande från en textsträng
   */
  public getTextFromContent(content: string): string | null {
    if (this.index < 0 || this.index + this.length > content.length) {
      return null;
    }

    return content.substring(this.index, this.index + this.length);
  }

  /**
   * Returnerar en representation av omnämnandet för debugging
   */
  public toString(): string {
    return `@${this.userId.toString()} (at index ${this.index}, length ${this.length})`;
  }
} 