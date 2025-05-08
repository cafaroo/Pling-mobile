import { UniqueId } from './UniqueId';

export abstract class DomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly eventId: UniqueId;

  constructor() {
    this.dateTimeOccurred = new Date();
    this.eventId = new UniqueId();
  }

  abstract get name(): string;
} 