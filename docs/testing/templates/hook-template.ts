/**
 * TEMPLATE FÖR STANDARDISERAD DOMAIN HOOK
 * 
 * Detta är en mall för att skapa nya standardiserade hooks för domäner.
 * Byt ut {{Domain}} med namnet på domänen (exempel: Team, User, Organization)
 * Byt ut {{domain}} med namnet på domänen i lowercase (exempel: team, user, organization)
 * 
 * Fyll i domänspecifika metoder och anpassa hooks efter behov
 */
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  createStandardizedQuery, 
  createStandardizedMutation,
  unwrapResult 
} from '@/application/shared/hooks/createStandardizedHook';
import { use{{Domain}}Context } from './use{{Domain}}Context';
import { 
  HookErrorCode, 
  ErrorContext
} from '@/application/shared/hooks/HookErrorTypes';
import { createLogger } from '@/infrastructure/logger';
import { {{Domain}} } from '@/domain/{{domain}}/entities/{{Domain}}';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';

const logger = createLogger('use{{Domain}}WithStandardHook');

/**
 * Skapar en standard felkontext för {{domain}}-relaterade operationer
 */
const create{{Domain}}ErrorContext = (operation: string, details?: Record<string, any>): ErrorContext => ({
  domain: '{{domain}}',
  operation,
  details,
  timestamp: new Date()
});

/**
 * DTO-typer för {{domain}}
 */
export interface Create{{Domain}}DTO {
  // Fyll i properties som behövs för att skapa en {{domain}}
  name: string;
  // ...andra fält
}

export interface Update{{Domain}}DTO {
  // Fyll i properties som behövs för att uppdatera en {{domain}}
  {{domain}}Id: string;
  name?: string;
  // ...andra fält
}

/**
 * Standardiserad hook för {{domain}}-operationer
 */
export function use{{Domain}}WithStandardHook() {
  const queryClient = useQueryClient();
  const {
    {{domain}}Repository,
    eventPublisher
    // Andra beroenden...
  } = use{{Domain}}Context();

  // ==================== QUERIES ====================

  /**
   * Hämtar en {{domain}} med ID
   */
  const useGet{{Domain}} = createStandardizedQuery<{{Domain}}, [string | undefined]>({
    queryKeyPrefix: '{{domain}}',
    buildQueryKey: (params) => {
      const {{domain}}Id = params?.[0] ?? '';
      return ['{{domain}}', {{domain}}Id];
    },
    queryFn: async ({{domain}}Id) => {
      if (!{{domain}}Id) return null;
      
      logger.info('Hämtar {{domain}}', { {{domain}}Id });
      const result = await {{domain}}Repository.findById({{domain}}Id);
      return unwrapResult(result);
    },
    enabled: (params) => {
      const {{domain}}Id = params?.[0];
      return Boolean({{domain}}Id);
    },
    staleTime: 5 * 60 * 1000, // 5 minuter
    errorContext: (params) => {
      const {{domain}}Id = params?.[0] ?? '';
      return create{{Domain}}ErrorContext('get{{Domain}}', { {{domain}}Id });
    },
    retry: 2
  });

  /**
   * Hämtar alla {{domain}}er för en användare
   */
  const useGet{{Domain}}sForUser = createStandardizedQuery<{{Domain}}[], [string | undefined]>({
    queryKeyPrefix: 'user{{Domain}}s',
    buildQueryKey: (params) => {
      const userId = params?.[0] ?? '';
      return ['{{domain}}s', 'user', userId];
    },
    queryFn: async (userId) => {
      if (!userId) return [];
      
      logger.info('Hämtar {{domain}}er för användare', { userId });
      const result = await {{domain}}Repository.findByUserId(userId);
      return unwrapResult(result);
    },
    enabled: (params) => {
      const userId = params?.[0];
      return Boolean(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minuter
    errorContext: (params) => {
      const userId = params?.[0] ?? '';
      return create{{Domain}}ErrorContext('get{{Domain}}sForUser', { userId });
    }
  });

  // ==================== MUTATIONS ====================

  /**
   * Skapar en ny {{domain}}
   */
  const useCreate{{Domain}} = createStandardizedMutation<{{Domain}}, Create{{Domain}}DTO>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Skapar ny {{domain}}', { name: params.name });
      
      // Uppdatera progress
      updateProgress?.({ percent: 30, message: 'Validerar...' });
      
      // Implementera skapande av {{domain}}
      // Detta kan anpassas efter behov - använd antingen direkt repository eller useCase
      const result = await {{domain}}Repository.create(params);
      
      updateProgress?.({ percent: 100, message: 'Klar!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['{{domain}}s', 'user', params.createdBy]
    ],
    errorContext: (params) => create{{Domain}}ErrorContext('create{{Domain}}', { params })
  });

  /**
   * Uppdaterar en {{domain}}
   */
  const useUpdate{{Domain}} = createStandardizedMutation<void, Update{{Domain}}DTO>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Uppdaterar {{domain}}', { {{domain}}Id: params.{{domain}}Id });
      
      updateProgress?.({ percent: 50, message: 'Uppdaterar...' });
      
      // Implementera uppdatering av {{domain}}
      const result = await {{domain}}Repository.update(params.{{domain}}Id, {
        name: params.name,
        // ...andra fält
      });
      
      updateProgress?.({ percent: 100, message: '{{Domain}} uppdaterad!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['{{domain}}', params.{{domain}}Id]
    ],
    optimisticUpdate: {
      queryKey: ['{{domain}}', params => params.{{domain}}Id],
      updateFn: (oldData: {{Domain}}, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt uppdatera entiteten
        return {
          ...oldData,
          name: variables.name ?? oldData.name,
          // ...andra fält
        };
      }
    },
    errorContext: (params) => create{{Domain}}ErrorContext('update{{Domain}}', { params })
  });

  /**
   * Tar bort en {{domain}}
   */
  const useDelete{{Domain}} = createStandardizedMutation<void, { {{domain}}Id: string }>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Tar bort {{domain}}', { {{domain}}Id: params.{{domain}}Id });
      
      updateProgress?.({ percent: 50, message: 'Tar bort...' });
      
      const result = await {{domain}}Repository.delete(params.{{domain}}Id);
      
      updateProgress?.({ percent: 100, message: '{{Domain}} borttagen!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      // Kan behöva anpassas baserat på vilka listor som behöver uppdateras
      ['{{domain}}s', 'all']
    ],
    errorContext: (params) => create{{Domain}}ErrorContext('delete{{Domain}}', { params })
  });

  return useMemo(() => ({
    // Queries
    useGet{{Domain}},
    useGet{{Domain}}sForUser,
    
    // Mutations
    useCreate{{Domain}},
    useUpdate{{Domain}},
    useDelete{{Domain}},
  }), [
    useGet{{Domain}},
    useGet{{Domain}}sForUser,
    useCreate{{Domain}},
    useUpdate{{Domain}},
    useDelete{{Domain}},
  ]);
}

export type Use{{Domain}}WithStandardHookResult = ReturnType<typeof use{{Domain}}WithStandardHook>; 