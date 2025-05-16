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
export * from './helpers/useCaseErrorTestHelper';

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

// Exportera helpers
export { InvariantTestHelper } from './helpers/invariantTestHelper';
export { AggregateTestHelper } from './helpers/aggregateTestHelper';

// Exportera mock factories
export { MockDomainEvents } from './mocks/mockDomainEvents';
export { MockEntityFactory } from './mocks/mockEntityFactory';
export { MockValueObjectFactory } from './mocks/mockValueObjectFactory';
export { MockServiceFactory } from './mocks/mockServiceFactory';
export { MockRepositoryFactory } from './mocks/mockRepositoryFactory';

// Existerande hjälpare
export { ResultTestHelper } from './helpers/resultTestHelper';
export { UserProfileTestHelper } from './helpers/userProfileTestHelper';

/**
 * Kombinerat testhjälppaket för domäntestning.
 * Innehåller allt som behövs för att testa domänmodellen:
 * - Testhjälpare för aggregat, invarianter och events
 * - Mock-factories för entities, värde-objekt, tjänster och repositories
 * - Verktyg för att testa Result-API och UserProfile
 */
export const TestKit = {
  // Testhjälpare
  aggregate: AggregateTestHelper,
  invariant: InvariantTestHelper,
  events: MockDomainEvents,
  result: ResultTestHelper,
  profile: UserProfileTestHelper,
  
  // Mock-factories
  mockEntity: MockEntityFactory,
  mockValueObject: MockValueObjectFactory,
  mockService: MockServiceFactory,
  mockRepository: MockRepositoryFactory,
  
  // Felhanteringshjälpare
  useCaseErrorTest: {
    testErrors: testUseCaseErrors,
    verifyEvents: verifyUseCaseErrorEvents
  }
};

// Hjälpfunktion för snabb åtkomst till testkit
export const createTestKit = () => TestKit; 