/**
 * Mock implementering av Supabase för testning
 */

// Grundläggande interface för en Supabase-tabell
interface MockTable {
  insert: (data: any) => { data: any, error: null | Error };
  select: (columns?: string) => MockSelectBuilder;
  update: (data: any) => MockUpdateBuilder;
  delete: () => MockDeleteBuilder;
}

// Interface för select-builder
interface MockSelectBuilder {
  eq: (column: string, value: any) => MockSelectBuilder;
  neq: (column: string, value: any) => MockSelectBuilder;
  match: (pattern: any) => MockSelectBuilder;
  gte: (column: string, value: any) => MockSelectBuilder;
  lte: (column: string, value: any) => MockSelectBuilder;
  contains: (column: string, value: any) => MockSelectBuilder;
  containedBy: (column: string, value: any) => MockSelectBuilder;
  in: (column: string, values: any[]) => MockSelectBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockSelectBuilder;
  range: (from: number, to: number) => MockSelectBuilder;
  limit: (count: number) => MockSelectBuilder;
  single: () => Promise<{ data: any, error: null | Error }>;
  maybeSingle: () => Promise<{ data: any, error: null | Error }>;
  then: (callback: (result: { data: any, error: null | Error }) => void) => Promise<any>;
}

// Interface för update-builder
interface MockUpdateBuilder {
  eq: (column: string, value: any) => MockUpdateBuilder;
  match: (pattern: any) => MockUpdateBuilder;
  then: (callback: (result: { data: any, error: null | Error }) => void) => Promise<any>;
}

// Interface för delete-builder
interface MockDeleteBuilder {
  eq: (column: string, value: any) => MockDeleteBuilder;
  match: (pattern: any) => MockDeleteBuilder;
  then: (callback: (result: { data: any, error: null | Error }) => void) => Promise<any>;
}

// Skapa en mock tabell
const createMockTable = (mockData: any[] = []): MockTable => {
  let data = [...mockData];
  
  // Select builder implementering
  const createSelectBuilder = (): MockSelectBuilder => {
    let filteredData = [...data];
    let limitCount: number | null = null;
    let rangeStart: number | null = null;
    let rangeEnd: number | null = null;
    
    const builder: MockSelectBuilder = {
      eq: (column, value) => {
        filteredData = filteredData.filter(item => item[column] === value);
        return builder;
      },
      neq: (column, value) => {
        filteredData = filteredData.filter(item => item[column] !== value);
        return builder;
      },
      match: (pattern) => {
        filteredData = filteredData.filter(item => 
          Object.entries(pattern).every(([key, value]) => item[key] === value)
        );
        return builder;
      },
      gte: (column, value) => {
        filteredData = filteredData.filter(item => item[column] >= value);
        return builder;
      },
      lte: (column, value) => {
        filteredData = filteredData.filter(item => item[column] <= value);
        return builder;
      },
      contains: (column, value) => {
        filteredData = filteredData.filter(item => 
          Array.isArray(item[column]) && item[column].includes(value)
        );
        return builder;
      },
      containedBy: (column, value) => {
        filteredData = filteredData.filter(item => 
          Array.isArray(value) && Array.isArray(item[column]) && 
          item[column].every(v => value.includes(v))
        );
        return builder;
      },
      in: (column, values) => {
        filteredData = filteredData.filter(item => values.includes(item[column]));
        return builder;
      },
      order: (column, options = {}) => {
        const { ascending = true } = options;
        filteredData.sort((a, b) => {
          if (ascending) {
            return a[column] < b[column] ? -1 : 1;
          } else {
            return a[column] > b[column] ? -1 : 1;
          }
        });
        return builder;
      },
      range: (from, to) => {
        rangeStart = from;
        rangeEnd = to;
        return builder;
      },
      limit: (count) => {
        limitCount = count;
        return builder;
      },
      single: async () => {
        if (filteredData.length === 0) {
          return { data: null, error: null };
        }
        return { data: filteredData[0], error: null };
      },
      maybeSingle: async () => {
        if (filteredData.length === 0) {
          return { data: null, error: null };
        }
        if (filteredData.length > 1) {
          return { data: null, error: new Error('Multiple results') };
        }
        return { data: filteredData[0], error: null };
      },
      then: async (callback) => {
        let result = filteredData;
        
        if (rangeStart !== null && rangeEnd !== null) {
          result = result.slice(rangeStart, rangeEnd + 1);
        }
        
        if (limitCount !== null) {
          result = result.slice(0, limitCount);
        }
        
        return callback({ data: result, error: null });
      }
    };
    
    return builder;
  };
  
  // Update builder implementering
  const createUpdateBuilder = (updateData: any): MockUpdateBuilder => {
    let targetData = [...data];
    
    const builder: MockUpdateBuilder = {
      eq: (column, value) => {
        targetData = targetData.filter(item => item[column] === value);
        return builder;
      },
      match: (pattern) => {
        targetData = targetData.filter(item => 
          Object.entries(pattern).every(([key, value]) => item[key] === value)
        );
        return builder;
      },
      then: async (callback) => {
        const updatedData = targetData.map(item => ({ ...item, ...updateData }));
        
        // Uppdatera huvuddatalagret
        data = data.map(item => {
          const matchingUpdated = targetData.find(target => 
            Object.entries(item).every(([key, value]) => target[key] === value)
          );
          
          if (matchingUpdated) {
            return { ...item, ...updateData };
          }
          
          return item;
        });
        
        return callback({ data: updatedData, error: null });
      }
    };
    
    return builder;
  };
  
  // Delete builder implementering
  const createDeleteBuilder = (): MockDeleteBuilder => {
    let targetData = [...data];
    
    const builder: MockDeleteBuilder = {
      eq: (column, value) => {
        targetData = targetData.filter(item => item[column] === value);
        return builder;
      },
      match: (pattern) => {
        targetData = targetData.filter(item => 
          Object.entries(pattern).every(([key, value]) => item[key] === value)
        );
        return builder;
      },
      then: async (callback) => {
        // Ta bort matchande poster från huvuddatalagret
        const originalLength = data.length;
        data = data.filter(item => !targetData.some(target => 
          Object.entries(item).every(([key, value]) => target[key] === value)
        ));
        
        const deletedCount = originalLength - data.length;
        return callback({ data: { count: deletedCount }, error: null });
      }
    };
    
    return builder;
  };
  
  return {
    insert: (newData) => {
      const insertedItem = Array.isArray(newData) 
        ? newData.map(item => ({ ...item, id: item.id || `mock-id-${Date.now()}` }))
        : { ...newData, id: newData.id || `mock-id-${Date.now()}` };
      
      if (Array.isArray(insertedItem)) {
        data.push(...insertedItem);
      } else {
        data.push(insertedItem);
      }
      
      return { data: insertedItem, error: null };
    },
    select: (columns) => createSelectBuilder(),
    update: (updateData) => createUpdateBuilder(updateData),
    delete: () => createDeleteBuilder()
  };
};

// Mock Supabase klient
export const createMockSupabase = () => {
  const tables: Record<string, MockTable> = {};
  
  return {
    from: (tableName: string) => {
      if (!tables[tableName]) {
        tables[tableName] = createMockTable();
      }
      return tables[tableName];
    },
    // Speciell metod för att förinitialisera tabell med data
    initTable: (tableName: string, initialData: any[]) => {
      tables[tableName] = createMockTable(initialData);
    },
    // Metod för att hämta all data för en tabell (för testverifiering)
    getTableData: (tableName: string) => {
      if (!tables[tableName]) {
        return [];
      }
      return tables[tableName];
    },
    // Auth-metoder
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } } }),
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'new-mock-user-id' } } }),
      signIn: jest.fn().mockResolvedValue({ data: { user: { id: 'existing-mock-user-id' } } }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
    }
  };
};

// Exportera förinitierade mockar för enkel användning
export const mockSupabase = createMockSupabase();
export const mockSupabaseClient = mockSupabase;

// Exportera default
export default mockSupabase; 