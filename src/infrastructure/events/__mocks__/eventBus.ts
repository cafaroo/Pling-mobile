import { EventBus } from '@/shared/core/EventBus';

export const eventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
} as unknown as EventBus;

export const getEventBus = jest.fn().mockReturnValue(eventBus); 