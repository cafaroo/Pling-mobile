import { UniqueId } from '@/shared/core/UniqueId';
import { createStandardizedQuery, createStandardizedMutation } from '@/application/shared/hooks/createStandardizedHook';
import { unwrapResult } from '@/application/shared/hooks/BaseHook';
import { User } from '@/domain/user/entities/User';
import { Email } from '@/domain/user/value-objects/Email';
import { useUserContext } from './useUserContext';
import { 
  CreateUserUseCase, 
  CreateUserDTO, 
  UpdateProfileUseCase, 
  UpdateProfileDTO,
  DeactivateUserUseCase, 
  DeactivateUserDTO,
  ActivateUserUseCase,
  ActivateUserDTO
} from '../useCases';

/**
 * Förbättrad hook för användaroperationer som använder standardiserade hook-verktyg
 * 
 * Denna hook använder konfigurationsbaserade creators för att standardisera
 * felhantering, caching och invalidering.
 */
export function useUserWithStandardHook() {
  const {
    userRepository,
    eventPublisher
  } = useUserContext();
  
  // ==================== QUERIES ====================
  
  /**
   * Hämtar en användare med ID
   */
  const useUserById = createStandardizedQuery<User, [string | undefined]>({
    queryKeyPrefix: 'user',
    buildQueryKey: ([userId]) => ['user', userId],
    queryFn: async (userId) => {
      if (!userId) return null;
      
      const result = await userRepository.findById(new UniqueId(userId));
      return unwrapResult(result);
    },
    enabled: ([userId]) => Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minuter
    refetchOnWindowFocus: true
  });
  
  /**
   * Hämtar en användare med e-post
   */
  const useUserByEmail = createStandardizedQuery<User, [string | undefined]>({
    queryKeyPrefix: 'userByEmail',
    buildQueryKey: ([email]) => ['user', 'email', email],
    queryFn: async (email) => {
      if (!email) return null;
      
      const result = await userRepository.findByEmail(new Email(email));
      return unwrapResult(result);
    },
    enabled: ([email]) => Boolean(email),
    staleTime: 5 * 60 * 1000 // 5 minuter
  });
  
  /**
   * Hämtar alla användare i ett team
   */
  const useTeamUsers = createStandardizedQuery<User[], [string | undefined]>({
    queryKeyPrefix: 'teamUsers',
    buildQueryKey: ([teamId]) => ['users', 'team', teamId],
    queryFn: async (teamId) => {
      if (!teamId) return [];
      
      const result = await userRepository.findByTeamId(new UniqueId(teamId));
      return unwrapResult(result);
    },
    enabled: ([teamId]) => Boolean(teamId),
    staleTime: 5 * 60 * 1000 // 5 minuter
  });
  
  // ==================== MUTATIONS ====================
  
  /**
   * Skapar en ny användare
   */
  const useCreateUser = createStandardizedMutation<User, CreateUserDTO>({
    mutationFn: async (dto) => {
      const createUserUseCase = new CreateUserUseCase(userRepository, eventPublisher);
      const result = await createUserUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: () => [
      ['users']
    ],
    onSuccess: (data) => {
      // Ytterligare logik som ska köras vid framgång
      console.log(`Användare skapad med ID: ${data.id.toString()}`);
    }
  });
  
  /**
   * Uppdaterar en användarprofil
   */
  const useUpdateProfile = createStandardizedMutation<void, UpdateProfileDTO>({
    mutationFn: async (dto) => {
      const updateProfileUseCase = new UpdateProfileUseCase(userRepository, eventPublisher);
      const result = await updateProfileUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['user', variables.userId]
    ]
  });
  
  /**
   * Deaktiverar en användare
   */
  const useDeactivateUser = createStandardizedMutation<void, DeactivateUserDTO>({
    mutationFn: async (dto) => {
      const deactivateUserUseCase = new DeactivateUserUseCase(userRepository, eventPublisher);
      const result = await deactivateUserUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['user', variables.userId]
    ]
  });
  
  /**
   * Aktiverar en användare
   */
  const useActivateUser = createStandardizedMutation<void, ActivateUserDTO>({
    mutationFn: async (dto) => {
      const activateUserUseCase = new ActivateUserUseCase(userRepository, eventPublisher);
      const result = await activateUserUseCase.execute(dto);
      return unwrapResult(result);
    },
    invalidateQueryKey: (variables) => [
      ['user', variables.userId]
    ]
  });
  
  return {
    // Queries
    useUserById,
    useUserByEmail,
    useTeamUsers,
    
    // Mutations
    useCreateUser,
    useUpdateProfile,
    useDeactivateUser,
    useActivateUser
  };
} 