/**
 * Standardiserad mock för Supabase
 * 
 * Används för att mocka Supabase-klienten i tester.
 * 
 * Exempel:
 * ```
 * import { mockSupabase } from '@/test-utils/mocks/SupabaseMock';
 * 
 * jest.mock('@/infrastructure/supabase', () => ({
 *   supabase: mockSupabase
 * }));
 * ```
 */

// Intern datastruktur för att lagra mockdata
const mockDataStore: Record<string, any[]> = {
  users: [],
  user_profiles: [],
  user_settings: []
};

export const mockSupabaseAuth = {
  getUser: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null
  }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  signIn: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} },
    error: null
  }),
  signUp: jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} },
    error: null
  }),
  onAuthStateChange: jest.fn().mockImplementation((callback) => {
    return { unsubscribe: jest.fn() };
  })
};

export const mockSupabaseStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn().mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null }),
  getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test/path.jpg' } }),
  remove: jest.fn().mockResolvedValue({ data: {}, error: null })
};

// Debuga mockdatan
function logMockData(tableName: string, label: string = '') {
  const data = mockDataStore[tableName] || [];
  console.log(`${label} Mockdata för ${tableName}:`, JSON.stringify(data, null, 2));
}

// Återanvändbara frågebyggare för Supabase
const createQueryBuilder = (tableName: string) => {
  let localData = [...(mockDataStore[tableName] || [])];
  let filterFns: Array<(item: any) => boolean> = [];
  let shouldReturnSingle = false;
  
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockImplementation((data) => {
      // Logga vad som ska läggas till
      console.log(`Försöker lägga till i ${tableName}:`, data);
      
      // Kolla efter duplicerade e-postadresser om det är users-tabellen
      if (tableName === 'users' && Array.isArray(data)) {
        const emails = data.map(u => u.email);
        const existingEmails = mockDataStore[tableName]?.filter(u => emails.includes(u.email)) || [];
        
        if (existingEmails.length > 0) {
          return {
            then: (callback: any) => Promise.resolve(callback({
              error: { message: 'duplicate key value violates unique constraint' },
              data: null
            }))
          };
        }
      }
      
      // Annars lägg till data
      return {
        then: (callback: any) => {
          if (!mockDataStore[tableName]) {
            mockDataStore[tableName] = [];
          }
          
          if (Array.isArray(data)) {
            mockDataStore[tableName] = [...mockDataStore[tableName], ...data];
          } else {
            mockDataStore[tableName] = [...mockDataStore[tableName], data];
          }
          
          // Logga efter att data lagts till
          logMockData(tableName, 'Efter insert:');
          
          return Promise.resolve(callback({ error: null, data }));
        }
      };
    }),
    upsert: jest.fn().mockImplementation((data) => {
      // Logga vad som ska uppdateras
      console.log(`Försöker uppdatera ${tableName}:`, data);
      
      // Om det är en array av data
      if (Array.isArray(data)) {
        return {
          then: (callback: any) => {
            // Hantera varje objekt separat
            data.forEach(item => {
              const id = item.id || item.user_id;
              if (!id) return;
              
              // Hitta objektet om det finns
              const index = mockDataStore[tableName]?.findIndex(
                stored => stored.id === id || stored.user_id === id
              );
              
              if (index !== -1 && index !== undefined && mockDataStore[tableName]) {
                // Uppdatera det befintliga objektet
                mockDataStore[tableName][index] = {
                  ...mockDataStore[tableName][index],
                  ...item
                };
              } else {
                // Lägg till nytt objekt
                if (!mockDataStore[tableName]) {
                  mockDataStore[tableName] = [];
                }
                mockDataStore[tableName].push(item);
              }
            });
            
            // Logga efter att data uppdaterats
            logMockData(tableName, 'Efter batch upsert:');
            
            return Promise.resolve(callback({
              error: null,
              data
            }));
          }
        };
      }
      
      // Hantera ett enskilt objekt
      return {
        then: (callback: any) => {
          const id = data.id || data.user_id;
          
          if (!mockDataStore[tableName]) {
            mockDataStore[tableName] = [];
          }
          
          if (id) {
            // Sök efter befintlig post med samma ID
            const existingIndex = mockDataStore[tableName]?.findIndex(
              u => u.id === id || u.user_id === id
            );
            
            if (existingIndex !== -1 && existingIndex !== undefined) {
              // Uppdatera befintlig post
              mockDataStore[tableName][existingIndex] = {
                ...mockDataStore[tableName][existingIndex],
                ...data
              };
            } else {
              // Lägg till ny post
              mockDataStore[tableName].push(data);
            }
          } else {
            // Lägg till ny post utan ID
            mockDataStore[tableName].push(data);
          }
          
          // Logga efter att data uppdaterats
          logMockData(tableName, 'Efter upsert:');
          
          return Promise.resolve(callback({
            error: null,
            data
          }));
        }
      };
    }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockImplementation(() => {
      // Lagra tidigare data för senare återställning
      const previousData = [...localData];
      
      return {
        eq: (field: string, value: any) => {
          // Filtrera bort poster med matchande fält
          mockDataStore[tableName] = mockDataStore[tableName]?.filter(item => item[field] !== value) || [];
          
          return {
            then: (callback: any) => Promise.resolve(callback({
              error: null,
              data: { count: previousData.length - mockDataStore[tableName].length }
            }))
          };
        },
        neq: jest.fn().mockReturnThis()
      };
    }),
    eq: jest.fn().mockImplementation((field, value) => {
      filterFns.push((item) => item[field] === value);
      
      // Om det är en .single() eller .maybeSingle() fråga, simulera direkt
      if (shouldReturnSingle) {
        const filteredData = localData.filter(item => item[field] === value);
        if (filteredData.length > 0) {
          return {
            then: (callback: any) => Promise.resolve(callback({
              data: filteredData[0],
              error: null
            }))
          };
        } else {
          return {
            then: (callback: any) => Promise.resolve(callback({
              data: null,
              error: { message: 'No match found' }
            }))
          };
        }
      }
      
      return builder;
    }),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => {
      shouldReturnSingle = true;
      return {
        then: (callback: any) => {
          let result = localData;
          
          // Tillämpa alla filter
          filterFns.forEach(fn => {
            result = result.filter(fn);
          });
          
          if (result.length === 0) {
            return Promise.resolve(callback({ data: null, error: null }));
          }
          
          return Promise.resolve(callback({ data: result[0], error: null }));
        }
      };
    }),
    maybeSingle: jest.fn().mockImplementation(() => {
      shouldReturnSingle = true;
      return {
        then: (callback: any) => {
          let result = localData;
          
          // Tillämpa alla filter
          filterFns.forEach(fn => {
            result = result.filter(fn);
          });
          
          if (result.length === 0) {
            return Promise.resolve(callback({ data: null, error: null }));
          }
          
          return Promise.resolve(callback({ data: result[0], error: null }));
        }
      };
    }),
    then: jest.fn().mockImplementation(callback => {
      let result = localData;
      
      // Tillämpa alla filter
      filterFns.forEach(fn => {
        result = result.filter(fn);
      });
      
      if (shouldReturnSingle) {
        const data = result.length > 0 ? result[0] : null;
        return Promise.resolve(callback({ data, error: null }));
      }
      
      return Promise.resolve(callback({ data: result, error: null }));
    }),
    values: jest.fn().mockReturnThis()
  };
  
  return builder;
};

export const mockSupabase = {
  auth: mockSupabaseAuth,
  storage: mockSupabaseStorage,
  from: jest.fn().mockImplementation(tableName => createQueryBuilder(tableName)),
  rpc: jest.fn().mockImplementation((procName, params) => ({
    ...createQueryBuilder(''),
    // Specifik implementation för rpc
    execute: jest.fn().mockResolvedValue({ data: {}, error: null })
  }))
};

// Mer avancerad mockad Supabase-klient för testning
export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  storage: mockSupabaseStorage,
  from: jest.fn().mockImplementation(tableName => createQueryBuilder(tableName)),
  rpc: jest.fn().mockImplementation((procName, params) => ({
    ...createQueryBuilder(''),
    execute: jest.fn().mockResolvedValue({ data: {}, error: null })
  })),
  
  // Metoder för testdatahantering
  setMockData: (tableName: string, data: any[]) => {
    mockDataStore[tableName] = [...data];
  },
  
  getMockData: (tableName: string) => {
    return [...(mockDataStore[tableName] || [])];
  },
  
  resetMockData: () => {
    Object.keys(mockDataStore).forEach(key => {
      mockDataStore[key] = [];
    });
  }
};

// Konfigurerar mockdata för en användare
export const mockUserData = (overrides = {}) => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Bio för testanvändare',
      location: 'Stockholm',
      contact: {
        email: 'test@example.com',
        phone: '+46701234567',
        alternativeEmail: null
      }
    },
    settings: {
      theme: 'dark',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public',
        allowSearchByEmail: true
      }
    },
    ...overrides
  };
  
  return testUser;
};

// Återställer alla mockar
export const resetMockSupabase = () => {
  Object.values(mockSupabaseAuth).forEach(
    mock => mock.mockClear?.()
  );
  
  Object.values(mockSupabaseStorage).forEach(
    mock => mock.mockClear?.()
  );
  
  mockSupabase.from.mockClear();
  mockSupabase.rpc.mockClear();
  mockSupabaseClient.from.mockClear();
  mockSupabaseClient.rpc.mockClear();
  
  // Återställ mockdata
  mockSupabaseClient.resetMockData();
}; 