/**
 * Test-verktyg
 * 
 * Centraliserad export av alla test-utils för enklare användning.
 */

// Exportera alla befintliga test-utils
export * from './mocks/mockEventBus';
export * from './mocks/mockSupabase';
export * from './mocks';

// Exportera våra nya test-helpers
export * from './resultTestHelper';
export * from './userProfileTestHelper';
export * from './eventTestHelper';
export * from './InvariantTestHelper';
export * from './AggregateTestHelper';

// Återexportera mockEventBus som standard export
export { mockEventBus } from './mocks/mockEventBus';

// Mock för Result-klassen
export { mockResult, mockOk, mockErr } from './mocks/ResultMock';

// Hjälpfunktioner för error-hantering
export {
  expectResultOk,
  expectResultErr,
  expectEventPublished,
  expectExactlyOneEventPublished,
  expectNoEventPublished
} from './error-helpers';

// Hjälpfunktioner för domänevent
export { DomainEventTestHelper } from './DomainEventTestHelper';

// AsyncStorage mock
export { mockAsyncStorage } from './mocks/AsyncStorageMock';

// Supabase mock
export { mockSupabaseClient, createSupabaseMock } from './mocks/SupabaseMock';

// React Native Toast Message mock
export { toast } from './mocks/ReactNativeToastMessage'; 