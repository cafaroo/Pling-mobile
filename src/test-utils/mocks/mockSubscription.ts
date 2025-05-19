/**
 * MockSubscription
 * 
 * Denna klass är en mockimplementation av Subscription-entiteten för testning.
 * Den tillhandahåller testspecifika metoder som setEventPublisher och save.
 */

import { DomainEventPublisher } from '@/shared/domain/events/DomainEventPublisher';
import { UniqueId } from '@/shared/core/UniqueId';
import { Subscription } from '@/domain/subscription/entities/Subscription';
import { SubscriptionStatus } from '@/domain/subscription/entities/SubscriptionTypes';
import { 
  SubscriptionCreatedEvent,
  SubscriptionStatusChangedEvent,
  SubscriptionPlanChangedEvent,
  SubscriptionCancelledEvent,
  SubscriptionPeriodUpdatedEvent
} from '@/domain/subscription/events';

export class MockSubscription {
  private originalSubscription: Subscription;
  private eventPublisher: DomainEventPublisher | null = null;
  private events: any[] = [];
  
  constructor(subscription: Subscription) {
    this.originalSubscription = subscription;
  }
  
  /**
   * Statisk fabriksmetod för att skapa en MockSubscription från en vanlig Subscription
   */
  static from(subscription: Subscription): MockSubscription {
    return new MockSubscription(subscription);
  }
  
  /**
   * Delegerar alla egenskaper till den ursprungliga prenumerationen
   */
  get id(): UniqueId {
    return this.originalSubscription.id;
  }
  
  get organizationId(): UniqueId {
    return this.originalSubscription.organizationId;
  }
  
  get planId(): string {
    return this.originalSubscription.planId;
  }
  
  get status(): SubscriptionStatus {
    return this.originalSubscription.status;
  }
  
  get startDate(): Date {
    return this.originalSubscription.startDate;
  }
  
  get endDate(): Date | null {
    return this.originalSubscription.endDate;
  }
  
  /**
   * Sätter event publisher för att fånga upp publicerade händelser
   */
  setEventPublisher(publisher: DomainEventPublisher): void {
    this.eventPublisher = publisher;
  }
  
  /**
   * Simulerar att spara prenumerationen och publicerar events
   */
  async save(): Promise<void> {
    if (this.eventPublisher && this.events.length > 0) {
      this.events.forEach(event => {
        this.eventPublisher?.publish(event);
      });
      this.events = [];
    }
  }
  
  /**
   * Ändrar prenumerationens status
   */
  changeStatus(newStatus: SubscriptionStatus): void {
    const oldStatus = this.originalSubscription.status;
    this.originalSubscription.changeStatus(newStatus);
    
    const event = new SubscriptionStatusChangedEvent({
      subscriptionId: this.id.toString(),
      organizationId: this.organizationId.toString(),
      oldStatus,
      newStatus
    });
    
    this.events.push(event);
  }
  
  /**
   * Ändrar prenumerationsplanen
   */
  changePlan(newPlanId: string): void {
    const oldPlanId = this.originalSubscription.planId;
    this.originalSubscription.changePlan(newPlanId);
    
    const event = new SubscriptionPlanChangedEvent({
      subscriptionId: this.id.toString(),
      organizationId: this.organizationId.toString(),
      oldPlanId,
      newPlanId
    });
    
    this.events.push(event);
  }
  
  /**
   * Avbryter prenumerationen
   */
  cancel(reason: string): void {
    this.originalSubscription.cancel(reason);
    
    const event = new SubscriptionCancelledEvent({
      subscriptionId: this.id.toString(),
      organizationId: this.organizationId.toString(),
      reason,
      cancelledAt: new Date()
    });
    
    this.events.push(event);
  }
  
  /**
   * Uppdaterar prenumerationsperioden
   */
  updatePeriod(newStartDate: Date, newEndDate: Date | null): void {
    const oldStartDate = this.originalSubscription.startDate;
    const oldEndDate = this.originalSubscription.endDate;
    this.originalSubscription.updatePeriod(newStartDate, newEndDate);
    
    const event = new SubscriptionPeriodUpdatedEvent({
      subscriptionId: this.id.toString(),
      organizationId: this.organizationId.toString(),
      oldStartDate,
      oldEndDate,
      newStartDate,
      newEndDate
    });
    
    this.events.push(event);
  }
}

/**
 * Funktion för att konvertera en vanlig Subscription till MockSubscription
 * för användning i tester
 */
export function createMockSubscription(subscription: Subscription): MockSubscription {
  return MockSubscription.from(subscription);
} 