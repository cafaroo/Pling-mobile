import { UniqueId } from './UniqueId';
import { DomainEvent } from './DomainEvent';

// Bas-props som alla aggregatroter måste ha
export interface AggregateRootProps {
  id: UniqueId;
}

export abstract class AggregateRoot<T extends AggregateRootProps> {
  private _domainEvents: DomainEvent[] = [];
  protected readonly props: T;

  get id(): UniqueId {
    return this.props.id;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected constructor(props: T) {
    this.props = props;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
} 