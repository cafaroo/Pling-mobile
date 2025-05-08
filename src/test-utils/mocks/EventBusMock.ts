/**
 * Standardiserad mock för EventBus
 * 
 * Använd denna fil för att konsekvent mocka EventBus i tester.
 * 
 * Exempel:
 * ```
 * import { mockEventBus } from '@/test-utils/mocks/EventBusMock';
 * 
 * jest.mock('@/shared/core/EventBus', () => ({
 *   EventBus: jest.fn().mockImplementation(() => mockEventBus),
 *   useEventBus: jest.fn().mockReturnValue(mockEventBus),
 *   getEventBus: jest.fn().mockReturnValue(mockEventBus)
 * }));
 * ```
 */

// Skapa ett mockEventBus-objekt som kan återanvändas
export const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockImplementation((eventType, callback) => {
    return { unsubscribe: jest.fn() };
  }),
  unsubscribe: jest.fn(),
  clear: jest.fn(),
  getSubscribers: jest.fn().mockReturnValue([]),
  hasSubscribers: jest.fn().mockReturnValue(false)
};

// Hjälpfunktion för att skapa en egen instans med anpassade callbacks
export const createMockEventBus = (overrides = {}) => ({
  ...mockEventBus,
  ...overrides
});

// Helper för att verifiera att en händelse publicerades
export const verifyEventPublished = (mockEventBusFn, eventType, matchProps = {}) => {
  expect(mockEventBusFn).toHaveBeenCalled();
  
  // Filtrera anrop efter eventType om det anges
  if (eventType) {
    const matchingCalls = mockEventBusFn.mock.calls.filter(
      call => call[0] && call[0].eventType === eventType
    );
    expect(matchingCalls.length).toBeGreaterThan(0);
    
    // Om det finns egenskaper att matcha, verifiera dem
    if (Object.keys(matchProps).length > 0) {
      const hasMatchingProps = matchingCalls.some(call => {
        const event = call[0];
        return Object.entries(matchProps).every(
          ([key, value]) => event[key] === value
        );
      });
      expect(hasMatchingProps).toBe(true);
    }
  }
};

// Helper för att återställa mockEventBus
export const resetMockEventBus = () => {
  mockEventBus.publish.mockClear();
  mockEventBus.subscribe.mockClear();
  mockEventBus.unsubscribe.mockClear();
  mockEventBus.clear.mockClear();
  mockEventBus.getSubscribers.mockClear();
  mockEventBus.hasSubscribers.mockClear();
}; 