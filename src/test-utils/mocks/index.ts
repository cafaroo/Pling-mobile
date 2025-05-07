/**
 * Testmockar för Pling-applikationen
 * 
 * Detta är en samlad exportfil för alla standardmockar som används i tester.
 * 
 * Exempel på användning:
 * ```
 * import { mockEventBus, mockResult, createTestUser } from '@/test-utils/mocks';
 * 
 * jest.mock('@/shared/events/EventBus', () => ({
 *   EventBus: jest.fn().mockImplementation(() => mockEventBus),
 *   useEventBus: jest.fn().mockReturnValue(mockEventBus)
 * }));
 * ```
 */

// EventBus-mockexporter
export {
  mockEventBus,
  createMockEventBus,
  verifyEventPublished,
  resetMockEventBus
} from './EventBusMock';

// Result-mockexporter
export {
  mockResult,
  createOkResult,
  createErrResult,
  resetMockResult
} from './ResultMock';

// Supabase-mockexporter
export {
  mockSupabase,
  mockSupabaseAuth,
  mockSupabaseStorage,
  mockUserData,
  resetMockSupabase
} from './SupabaseMock';

// React-komponentmockexporter
export {
  createMockComponent,
  createMockComponentWithChildren,
  createMockTextComponent,
  createMockHook,
  createReactNativePaperMock,
  createExpoVectorIconsMock
} from './ComponentMocks';

// Användarspecifik testdata
export {
  TEST_USER_DATA,
  createTestContact,
  createTestUserProfile,
  createTestUserSettings,
  createTestUser,
  createTestUserDTO
} from './UserTestData'; 