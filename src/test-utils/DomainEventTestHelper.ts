import { DomainEvent } from '@/shared/core/DomainEvent';
import { MockEventBus } from '@/infrastructure/events/__mocks__/eventBus';

export class DomainEventTestHelper {
  static expectEventPublished<T extends DomainEvent>(
    mockEventBus: MockEventBus,
    eventType: new (...args: any[]) => T,
    expectedProps: Partial<T>
  ): void {
    const publishedEvents = mockEventBus.getPublishedEvents();
    const matchingEvents = publishedEvents.filter(event => event instanceof eventType);

    expect(matchingEvents.length).toBeGreaterThan(0);

    const matchingEvent = matchingEvents[0] as T;
    Object.entries(expectedProps).forEach(([key, value]) => {
      expect(matchingEvent[key as keyof T]).toEqual(value);
    });
  }

  static expectEventNotPublished<T extends DomainEvent>(
    mockEventBus: MockEventBus,
    eventType: new (...args: any[]) => T
  ): void {
    const publishedEvents = mockEventBus.getPublishedEvents();
    const matchingEvents = publishedEvents.filter(event => event instanceof eventType);
    expect(matchingEvents.length).toBe(0);
  }

  static expectEventCount<T extends DomainEvent>(
    mockEventBus: MockEventBus,
    eventType: new (...args: any[]) => T,
    expectedCount: number
  ): void {
    const publishedEvents = mockEventBus.getPublishedEvents();
    const matchingEvents = publishedEvents.filter(event => event instanceof eventType);
    expect(matchingEvents.length).toBe(expectedCount);
  }

  static clearEvents(mockEventBus: MockEventBus): void {
    mockEventBus.clearEvents();
  }
} 