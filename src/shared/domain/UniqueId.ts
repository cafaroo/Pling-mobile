import { v4 as uuidv4 } from 'uuid';

export class UniqueId {
  private readonly id: string;

  constructor(id?: string) {
    this.id = id || uuidv4();
  }

  public equals(id?: UniqueId): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    return this.toString() === id.toString();
  }

  public toString(): string {
    return this.id;
  }
} 