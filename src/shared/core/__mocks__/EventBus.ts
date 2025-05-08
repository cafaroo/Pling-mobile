import { DomainEvent } from '../DomainEvent';

export class MockEventBus {
  private publishedEvents: DomainEvent[] = [];
  
  public publish(event: DomainEvent): void {
    this.publishedEvents.push(event);
  }
  
  public getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents];
  }
  
  public clearEvents(): void {
    this.publishedEvents = [];
  }
  
  public findEventsByName(name: string): DomainEvent[] {
    return this.publishedEvents.filter(event => event.name === name);
  }
  
  public hasPublishedEventOfType(name: string): boolean {
    return this.publishedEvents.some(event => event.name === name);
  }
  
  public getLatestEventOfType(name: string): DomainEvent | undefined {
    const events = this.findEventsByName(name);
    return events[events.length - 1];
  }
}

export const EventBus = MockEventBus; 