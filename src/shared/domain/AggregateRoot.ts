import { Entity } from './Entity';
import { IDomainEvent } from './events/IDomainEvent';
import { UniqueId } from '../core/UniqueId';

/**
 * AggregateRoot
 * 
 * Basklass för aggregatrötter enligt DDD-principer.
 * En aggregatrot är en entitet som garanterar konsistens för ett aggregat.
 * Endast aggregatrötter ska publicera domänevents.
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: IDomainEvent[] = [];

  constructor(props: T, id?: UniqueId) {
    super(props, id);
  }

  /**
   * Lägger till en domänhändelse till händelselistan
   * @param domainEvent Händelse att lägga till
   */
  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Rensar listan med domänhändelser
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Hämtar alla domänhändelser för aggregatroten
   */
  public getDomainEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Callback som anropas efter att ett domänevent sparats/publicerats
   * Kan överridas av konkreta klasser för specifik hantering
   */
  protected onEventSaved(): void {}
} 