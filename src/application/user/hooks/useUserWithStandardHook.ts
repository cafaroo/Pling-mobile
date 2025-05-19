import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  createStandardizedQuery, 
  createStandardizedMutation,
  unwrapResult 
} from '@/application/shared/hooks/createStandardizedHook';
import { useUserContext } from './useUserContext';
import { 
  HookErrorCode, 
  ErrorContext
} from '@/application/shared/hooks/HookErrorTypes';
import { createLogger } from '@/infrastructure/logger';
import { User } from '@/domain/user/entities/User';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';

const logger = createLogger('useUserWithStandardHook');

/**
 * Skapar en standard felkontext för användar-relaterade operationer
 */
const createUserErrorContext = (operation: string, details?: Record<string, any>): ErrorContext => ({
  domain: 'user',
  operation,
  details,
  timestamp: new Date()
});

/**
 * Standardiserad hook för användaroperationer
 */
export function useUserWithStandardHook() {
  const queryClient = useQueryClient();
  const {
    userRepository,
    eventPublisher
  } = useUserContext();

  // ==================== QUERIES ====================

  /**
   * Hämtar en användare med ID
   */
  const useGetUser = createStandardizedQuery<User, [string | undefined]>({
    queryKeyPrefix: 'user',
    buildQueryKey: (params) => {
      const userId = params?.[0] ?? '';
      return ['user', userId];
    },
    queryFn: async (userId) => {
      if (!userId) return null;
      
      logger.info('Hämtar användare', { userId });
      // Antar att userRepository har en findById-metod
      const result = await userRepository.findById(userId);
      return unwrapResult(result);
    },
    enabled: (params) => {
      const userId = params?.[0];
      return Boolean(userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minuter
    errorContext: (params) => {
      const userId = params?.[0] ?? '';
      return createUserErrorContext('getUser', { userId });
    },
    retry: 2
  });

  /**
   * Hämtar aktuell inloggad användare
   */
  const useGetCurrentUser = createStandardizedQuery<User, []>({
    queryKeyPrefix: 'currentUser',
    buildQueryKey: () => ['currentUser'],
    queryFn: async () => {
      logger.info('Hämtar nuvarande användare');
      // Antar att userRepository har en getCurrentUser-metod
      const result = await userRepository.getCurrentUser();
      return unwrapResult(result);
    },
    staleTime: 2 * 60 * 1000, // 2 minuter
    errorContext: () => createUserErrorContext('getCurrentUser'),
    retry: 2
  });

  // ==================== MUTATIONS ====================

  /**
   * Uppdaterar användarprofil
   */
  const useUpdateUserProfile = createStandardizedMutation<User, { 
    userId: string, 
    firstName?: string, 
    lastName?: string, 
    email?: string, 
    phoneNumber?: string,
    avatarUrl?: string 
  }>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Uppdaterar användarprofil', { userId: params.userId });
      
      updateProgress?.({ percent: 30, message: 'Validerar profiluppgifter...' });
      
      // Antar att vi har ett updateProfile-användningsfall
      const result = await userRepository.updateProfile(params.userId, {
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        phoneNumber: params.phoneNumber,
        avatarUrl: params.avatarUrl,
      });
      
      updateProgress?.({ percent: 100, message: 'Profil uppdaterad!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['user', params.userId],
      ['currentUser']
    ],
    optimisticUpdate: {
      queryKey: ['user', params => params.userId],
      updateFn: (oldData: User, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt uppdatera profilen
        return {
          ...oldData,
          profile: {
            ...oldData.profile,
            firstName: variables.firstName ?? oldData.profile.firstName,
            lastName: variables.lastName ?? oldData.profile.lastName,
            email: variables.email ?? oldData.profile.email,
            phoneNumber: variables.phoneNumber ?? oldData.profile.phoneNumber,
            avatarUrl: variables.avatarUrl ?? oldData.profile.avatarUrl,
          }
        };
      }
    },
    errorContext: (params) => createUserErrorContext('updateUserProfile', { params })
  });

  /**
   * Uppdaterar användarinställningar
   */
  const useUpdateUserSettings = createStandardizedMutation<void, { 
    userId: string, 
    theme?: string,
    language?: string,
    notificationsEnabled?: boolean,
    privacySettings?: object
  }>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Uppdaterar användarinställningar', { userId: params.userId });
      
      updateProgress?.({ percent: 50, message: 'Sparar inställningar...' });
      
      // Antar att vi har en updateSettings-metod
      const result = await userRepository.updateSettings(params.userId, {
        theme: params.theme,
        language: params.language,
        notificationsEnabled: params.notificationsEnabled,
        privacySettings: params.privacySettings
      });
      
      updateProgress?.({ percent: 100, message: 'Inställningar uppdaterade!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['user', params.userId],
      ['currentUser']
    ],
    optimisticUpdate: {
      queryKey: ['user', params => params.userId],
      updateFn: (oldData: User, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt uppdatera användarinställningar
        return {
          ...oldData,
          settings: {
            ...oldData.settings,
            theme: variables.theme ?? oldData.settings.theme,
            language: variables.language ?? oldData.settings.language,
            notificationsEnabled: variables.notificationsEnabled ?? oldData.settings.notificationsEnabled,
            privacySettings: variables.privacySettings ?? oldData.settings.privacySettings,
          }
        };
      }
    },
    errorContext: (params) => createUserErrorContext('updateUserSettings', { params })
  });

  /**
   * Aktiverar en användare
   */
  const useActivateUser = createStandardizedMutation<void, {
    userId: string
  }>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Aktiverar användare', { userId: params.userId });
      
      updateProgress?.({ percent: 30, message: 'Aktiverar konto...' });
      
      // Antar att vi har en aktiveringsmetod
      const result = await userRepository.activateUser(params.userId);
      
      updateProgress?.({ percent: 100, message: 'Användare aktiverad!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['user', params.userId],
      ['currentUser']
    ],
    optimisticUpdate: {
      queryKey: ['user', params => params.userId],
      updateFn: (oldData: User, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt sätta status till aktiv
        return {
          ...oldData,
          status: 'active'
        };
      }
    },
    errorContext: (params) => createUserErrorContext('activateUser', { params })
  });

  /**
   * Inaktiverar en användare
   */
  const useDeactivateUser = createStandardizedMutation<void, {
    userId: string,
    reason?: string
  }>({
    mutationFn: async (params, updateProgress) => {
      logger.info('Inaktiverar användare', { userId: params.userId, reason: params.reason });
      
      updateProgress?.({ percent: 30, message: 'Inaktiverar konto...' });
      
      // Antar att vi har en deaktiveringsmetod
      const result = await userRepository.deactivateUser(params.userId, params.reason);
      
      updateProgress?.({ percent: 100, message: 'Användare inaktiverad!' });
      
      return unwrapResult(result);
    },
    invalidateQueryKey: (params) => [
      ['user', params.userId],
      ['currentUser']
    ],
    optimisticUpdate: {
      queryKey: ['user', params => params.userId],
      updateFn: (oldData: User, variables) => {
        if (!oldData) return oldData;
        
        // Optimistiskt sätta status till inaktiv
        return {
          ...oldData,
          status: 'inactive'
        };
      }
    },
    errorContext: (params) => createUserErrorContext('deactivateUser', { params })
  });

  return useMemo(() => ({
    useGetUser,
    useGetCurrentUser,
    useUpdateUserProfile,
    useUpdateUserSettings,
    useActivateUser,
    useDeactivateUser
  }), [
    useGetUser,
    useGetCurrentUser,
    useUpdateUserProfile,
    useUpdateUserSettings,
    useActivateUser,
    useDeactivateUser
  ]);
}

export type UseUserWithStandardHookResult = ReturnType<typeof useUserWithStandardHook>; 