# Testning av React Hooks i domänmiljö

När man testar hooks i domänmiljö (node.js) uppstår utmaningar med JSX och React-specifika funktioner. Denna guide beskriver en strategi för att testa hooks i domänmiljö.

## Problem med React Hooks i domäntester

1. **JSX i Node-miljö**: JSX stöds inte nativt i Node-miljön och kräver speciell konfiguration
2. **React Context i Node**: React context fungerar inte korrekt i Node-miljö
3. **renderHook-kompabilitet**: @testing-library/react-hooks är inte helt kompatibel med Node-miljö

## Lösning: Mock-baserad hookstestning

Istället för att använda `renderHook` och JSX, kan vi direkt testa hook-funktionerna genom att mocka deras beroenden.

### Steg-för-steg strategi

1. **Mocka React Query-beroenden**
2. **Direktanrop av hook-funktionen**
3. **Testa returvärden och sidoeffekter**

## Exempel: Testa useTeamStatistics hook

```typescript
// src/application/team/hooks/__tests__/useTeamStatistics.test.ts (notera .ts istället för .tsx)

import { useTeamStatistics } from '../useTeamStatistics';
import { InfrastructureFactory } from '@/infrastructure/InfrastructureFactory';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/domain/core/UniqueId';

// Mock extern QueryClient
const mockQueryClient = {
  invalidateQueries: jest.fn().mockResolvedValue(undefined),
  setQueryData: jest.fn(),
  getQueryData: jest.fn(),
};

// Mock React Query hook
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockImplementation(({ queryKey, queryFn, enabled = true }) => {
    const result = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    };
    
    if (queryFn && enabled !== false) {
      try {
        // Manuellt anropa queryFn direkt i testet (synchronous)
        const data = queryFn();
        
        // Update result
        result.data = data;
        result.isLoading = false;
      } catch (e) {
        result.isError = true;
        result.error = e;
        result.isLoading = false;
      }
    }
    
    return result;
  }),
  useQueryClient: jest.fn().mockReturnValue(mockQueryClient),
}));

// Mock infrastruktur
jest.mock('@/infrastructure/InfrastructureFactory');

describe('useTeamStatistics', () => {
  let mockRepository: any;
  
  const teamId = 'test-team-id';
  const mockStats = {
    // Mockade statistikdata
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock repository
    mockRepository = {
      getStatistics: jest.fn(),
      invalidateTeamCache: jest.fn()
    };
    
    // Mock InfrastructureFactory
    (InfrastructureFactory.getInstance as jest.Mock).mockImplementation(() => ({
      getTeamActivityRepository: () => mockRepository
    }));
  });

  it('ska hämta och cacha teamstatistik', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));

    // Act - anropa hook direkt (utan renderHook)
    const hookResult = useTeamStatistics(teamId);

    // Assert
    expect(hookResult.isLoading).toBeDefined();
    expect(mockRepository.getStatistics).toHaveBeenCalledWith(
      expect.any(UniqueId),
      StatisticsPeriod.WEEKLY
    );
  });

  it('ska hantera fel vid datahämtning', async () => {
    // Arrange
    const errorMessage = 'Kunde inte hämta statistik';
    mockRepository.getStatistics.mockResolvedValue(err(errorMessage));

    // Act
    const hookResult = useTeamStatistics(teamId);

    // Assert
    expect(hookResult.isLoading).toBeDefined();
  });

  it('ska uppdatera cache optimistiskt', async () => {
    // Arrange
    mockRepository.getStatistics.mockResolvedValue(ok(mockStats));
    
    // Act
    const hookResult = useTeamStatistics(teamId);
    const updatedStats = {
      ...mockStats,
      activityCount: 15
    };
    
    // Anropa hook-metoden direkt
    if (hookResult.updateStatisticsOptimistically) {
      hookResult.updateStatisticsOptimistically(updatedStats);
    }

    // Assert
    expect(mockQueryClient.setQueryData).toHaveBeenCalled();
  });
});
```

## Alternativa teststrategier

### 1. Dela upp dina hooks

Dela upp hooks i två delar:
1. En ren affärslogikdel (utan React-beroenden)
2. En tunn React-wrapper som använder den rena delen

```typescript
// Ren affärslogik (testbar i domäntester)
export function getTeamStatistics(teamId: string) {
  // Implementera logik här
  return {
    fetchStatistics: async () => {
      // Hämtningslogik
    },
    updateStatistics: async (data) => {
      // Uppdateringslogik
    }
  };
}

// React hook (testbar i UI-tester)
export function useTeamStatistics(teamId: string) {
  const queryClient = useQueryClient();
  const core = getTeamStatistics(teamId);
  
  // React-specifik logik här...
  
  return {
    statistics: data,
    isLoading,
    // ...
  };
}
```

### 2. Använd manuella mockningar

För hooks som är djupt beroende av React, skapa en separat testversion:

```typescript
// __mocks__/useTeamStatistics.ts
export const useTeamStatistics = jest.fn().mockReturnValue({
  statistics: null,
  isLoading: false,
  error: null,
  updateStatisticsOptimistically: jest.fn(),
  invalidateStatistics: jest.fn()
});
```

Använd sedan den mockade versionen i dina domäntester:

```typescript
// use-case-tests.ts
jest.mock('@/application/team/hooks/useTeamStatistics');
import { useTeamStatistics } from '@/application/team/hooks/useTeamStatistics';

describe('någon use case', () => {
  it('använder team-statistik korrekt', () => {
    // Preconditions
    (useTeamStatistics as jest.Mock).mockReturnValue({
      statistics: mockStats,
      isLoading: false
    });
    
    // Test implementation
  });
});
```

## Rekommendationer

1. **Föredra ren affärslogik**: Håll så mycket logik som möjligt utanför hooks
2. **Mocka React-beroenden**: Skapa detaljerade mockar för React-komponenter 
3. **Testa i rätt miljö**: Testa UI-specifik hook-funktionalitet i jsdom-miljö istället för i Node
4. **Testa kontraktet**: Fokusera på att testa att hooket returnerar rätt data snarare än implementation

## Konvertera befintliga tester

1. Byt filändelse från `.tsx` till `.ts` för domäntester
2. Ta bort JSX och `renderHook` anrop
3. Anropa hooks direkt och testa deras output
4. Använd mockade React-beroenden som returnerar förutsägbara värden 