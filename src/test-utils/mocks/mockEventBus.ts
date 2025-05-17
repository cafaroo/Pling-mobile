/**
 * Mock implementering av EventBus för testning
 */

import { DomainEvent } from '@/shared/core/DomainEvent';
import { EventBus } from '@/shared/core/EventBus';

type EventHandler = (event: any) => void | Promise<void>;

/**
 * MockEventBus - En mock-implementation av EventBus för tester
 */
export class MockEventBus {
  /**
   * Lagrar alla publicerade event för testverifikation
   */
  publish = jest.fn().mockImplementation((event) => {
    return Promise.resolve();
  });

  /**
   * Mockad prenumeration på events
   */
  subscribe = jest.fn().mockImplementation((eventType, callback) => {
    return {
      unsubscribe: jest.fn()
    };
  });

  /**
   * Mockad avregistrering av event-prenumeration
   */
  unsubscribe = jest.fn();

  /**
   * Rensar alla sparade events och återställer mocks
   */
  clearEvents() {
    this.publish.mockClear();
    this.subscribe.mockClear();
    this.unsubscribe.mockClear();
  }
}

/**
 * Skapar en standardinstans för enkel användning i tester
 */
export const createMockEventBus = () => new MockEventBus();

export default MockEventBus; 