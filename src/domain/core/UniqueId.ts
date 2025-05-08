import { v4 as uuidv4 } from 'uuid';
import { Result } from './Result';

export class UniqueId {
  private readonly id: string;

  private constructor(id?: string) {
    this.id = id || uuidv4();
  }

  static create(id?: string): Result<UniqueId, string> {
    if (id && !UniqueId.isValidUUID(id)) {
      return Result.err('Ogiltigt UUID format');
    }
    return Result.ok(new UniqueId(id));
  }

  private static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  equals(other: UniqueId): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return this.id;
  }

  toValue(): string {
    return this.id;
  }
} 