import { EventBus } from '@/shared/core/EventBus';
import { DomainEvent } from '@/shared/core/DomainEvent';

export const eventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
} as unknown as EventBus;

export const getEventBus = jest.fn().mockReturnValue(eventBus);

export class MockEventBus {
  private publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  getPublishedEvents(): DomainEvent[] {
    return this.publishedEvents;
  }

  clearEvents(): void {
    this.publishedEvents = [];
  }
} 