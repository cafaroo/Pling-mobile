/**
 * Test-utils
 * 
 * Återexport av alla test-utils för enklare import
 */

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