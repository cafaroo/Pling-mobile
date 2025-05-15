import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UniqueId } from '@/shared/core/UniqueId';
import { 
  CreateTeamUseCase, 
  AddTeamMemberUseCase,
  RemoveTeamMemberUseCase,
  UpdateTeamMemberRoleUseCase,
  InviteTeamMemberUseCase,
  GetTeamStatisticsUseCase,
  CreateTeamActivityUseCase,
  CreateTeamMessageUseCase
} from '../useCases';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamActivityRepository } from '@/domain/team/repositories/TeamActivityRepository';
import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { 
  CreateTeamResponse, 
  CreateTeamDTO,
  AddTeamMemberDTO,
  RemoveTeamMemberDTO,
  UpdateTeamMemberRoleDTO,
  InviteTeamMemberDTO,
  TeamDTO,
  TeamStatisticsDTO,
  CreateTeamActivityDTO,
  CreateTeamMessageDTO
} from '../dto';
import { 
  createStandardizedQuery, 
  createStandardizedMutation,
  unwrapResult 
} from '@/application/shared/hooks/createStandardizedHook';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';

/**
 * Hook för hantering av team med de refaktorerade Use Cases
 * Följer standard DDD-principer och använder React Query
 */
export function useTeamStandardized(
  teamRepository: TeamRepository,
  userRepository: UserRepository,
  teamActivityRepository: TeamActivityRepository,
  eventPublisher: IDomainEventPublisher
) {
  const queryClient = useQueryClient();
  
  /**
   * Skapar en felkontext för team-relaterade operationer
   */
  const createTeamErrorContext = (operation: string) => ({
    domain: 'team',
    operation,
    timestamp: new Date()
  });
  
  /**
   * Hämtar ett specifikt team med ID
   */
  const useTeamById = createStandardizedQuery({
    queryKeyPrefix: 'team',
    buildQueryKey: (teamId: string | undefined) => ['team', teamId],
    queryFn: async (teamId: string | undefined) => {
      if (!teamId) return null;
      
      const id = new UniqueId(teamId);
      const result = await teamRepository.findById(id);
      
      return unwrapResult(result);
    },
    enabled: (teamId) => !!teamId,
    errorContext: (teamId) => ({
      ...createTeamErrorContext('getTeamById'),
      details: { teamId }
    }),
    onProgress: (progress: ProgressInfo) => {
      console.log(`Team hämtning: ${progress.percent}% - ${progress.message || ''}`);
    },
    staleTime: 60000 // 1 minut
  });
  
  /**
   * Hämtar alla team som en användare är medlem i
   */
  const useUserTeams = createStandardizedQuery({
    queryKeyPrefix: 'userTeams',
    buildQueryKey: (userId: string | undefined) => ['teams', 'user', userId],
    queryFn: async (userId: string | undefined) => {
      if (!userId) return [];
      
      const id = new UniqueId(userId);
      const result = await teamRepository.findByMemberId(id);
      
      return unwrapResult(result);
    },
    enabled: (userId) => !!userId,
    errorContext: (userId) => ({
      ...createTeamErrorContext('getUserTeams'),
      details: { userId }
    }),
    staleTime: 60000, // 1 minut
    cacheTime: 300000 // 5 minuter
  });
  
  /**
   * Skapar ett nytt team
   */
  const useCreateTeam = createStandardizedMutation({
    mutationFn: async (dto: CreateTeamDTO, updateProgress?: (progress: ProgressInfo) => void): Promise<CreateTeamResponse> => {
      const createTeamUseCase = new CreateTeamUseCase(teamRepository, eventPublisher);
      
      // Initiera progressuppdateringar
      updateProgress?.({ percent: 10, message: 'Validerar data...' });
      
      // Simulera validering
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress?.({ percent: 30, message: 'Skapar team...' });
      
      const result = await createTeamUseCase.execute(dto);
      
      updateProgress?.({ percent: 80, message: 'Slutför registrering...' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      updateProgress?.({ percent: 100, message: 'Team skapat!' });
      
      return unwrapResult(result);
    },
    onSuccess: (data, variables) => {
      // Invalidera relevanta queries
      queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.ownerId] });
      queryClient.invalidateQueries({ queryKey: ['team', data.teamId] });
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('createTeam'),
      details: { ownerId: variables.ownerId, name: variables.name }
    })
  });
  
  /**
   * Lägger till en medlem i ett team
   */
  const useAddTeamMember = createStandardizedMutation({
    mutationFn: async (dto: AddTeamMemberDTO, updateProgress?: (progress: ProgressInfo) => void) => {
      const addTeamMemberUseCase = new AddTeamMemberUseCase(teamRepository, eventPublisher);
      
      updateProgress?.({ percent: 20, message: 'Validerar medlemsuppgifter...' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      updateProgress?.({ percent: 60, message: 'Lägger till medlem...' });
      const result = await addTeamMemberUseCase.execute(dto);
      
      updateProgress?.({ percent: 100, message: 'Medlem tillagd!' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera team-data och medlemsdata
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.userId] });
    },
    optimisticUpdate: {
      queryKey: ['team', (variables) => variables.teamId],
      updateFn: (oldData: any, variables) => {
        if (!oldData || !oldData.members) return oldData;
        
        // Skapa en optimistisk uppdatering - lägg till den nya medlemmen 
        return {
          ...oldData,
          members: [
            ...oldData.members,
            {
              id: variables.userId,
              role: variables.role || 'member',
              addedAt: new Date().toISOString()
            }
          ]
        };
      }
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('addTeamMember'),
      details: { teamId: variables.teamId, userId: variables.userId }
    })
  });
  
  /**
   * Tar bort en medlem från ett team
   */
  const useRemoveTeamMember = createStandardizedMutation({
    mutationFn: async (dto: RemoveTeamMemberDTO, updateProgress?: (progress: ProgressInfo) => void) => {
      const removeTeamMemberUseCase = new RemoveTeamMemberUseCase(teamRepository, eventPublisher);
      
      updateProgress?.({ percent: 30, message: 'Tar bort medlem...' });
      const result = await removeTeamMemberUseCase.execute(dto);
      
      updateProgress?.({ percent: 100, message: 'Medlem borttagen!' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera team-data och medlemsdata
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'user', variables.userId] });
    },
    optimisticUpdate: {
      queryKey: ['team', (variables) => variables.teamId],
      updateFn: (oldData: any, variables) => {
        if (!oldData || !oldData.members) return oldData;
        
        // Skapa en optimistisk uppdatering - ta bort medlemmen
        return {
          ...oldData,
          members: oldData.members.filter(member => member.id !== variables.userId)
        };
      }
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('removeTeamMember'),
      details: { teamId: variables.teamId, userId: variables.userId }
    })
  });
  
  /**
   * Uppdaterar rollen för en teammedlem
   */
  const useUpdateTeamMemberRole = createStandardizedMutation({
    mutationFn: async (dto: UpdateTeamMemberRoleDTO, updateProgress?: (progress: ProgressInfo) => void) => {
      const updateTeamMemberRoleUseCase = new UpdateTeamMemberRoleUseCase(teamRepository, eventPublisher);
      
      updateProgress?.({ percent: 40, message: 'Uppdaterar roll...' });
      const result = await updateTeamMemberRoleUseCase.execute(dto);
      
      updateProgress?.({ percent: 100, message: 'Roll uppdaterad!' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera team-data
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId] });
    },
    optimisticUpdate: {
      queryKey: ['team', (variables) => variables.teamId],
      updateFn: (oldData: any, variables) => {
        if (!oldData || !oldData.members) return oldData;
        
        // Skapa en optimistisk uppdatering - uppdatera medlemmens roll
        return {
          ...oldData,
          members: oldData.members.map(member => 
            member.id === variables.userId 
              ? { ...member, role: variables.role }
              : member
          )
        };
      }
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('updateTeamMemberRole'),
      details: { teamId: variables.teamId, userId: variables.userId, role: variables.role }
    })
  });
  
  /**
   * Bjuder in en användare till ett team
   */
  const useInviteTeamMember = createStandardizedMutation({
    mutationFn: async (dto: InviteTeamMemberDTO, updateProgress?: (progress: ProgressInfo) => void) => {
      const inviteTeamMemberUseCase = new InviteTeamMemberUseCase(
        teamRepository, 
        userRepository, 
        eventPublisher
      );
      
      updateProgress?.({ percent: 20, message: 'Verifierar e-postadress...' });
      await new Promise(resolve => setTimeout(resolve, 200));
      
      updateProgress?.({ percent: 50, message: 'Skapar inbjudan...' });
      const result = await inviteTeamMemberUseCase.execute(dto);
      
      updateProgress?.({ percent: 90, message: 'Skickar inbjudan...' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      updateProgress?.({ percent: 100, message: 'Inbjudan skickad!' });
      
      return unwrapResult(result);
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('inviteTeamMember'),
      details: { teamId: variables.teamId, email: variables.email }
    })
  });
  
  /**
   * Hämtar statistik för ett team
   */
  const useTeamStatistics = createStandardizedQuery({
    queryKeyPrefix: 'teamStatistics',
    buildQueryKey: (teamId: string | undefined) => ['team', teamId, 'statistics'],
    queryFn: async (teamId: string | undefined) => {
      if (!teamId) return null;
      
      const getTeamStatisticsUseCase = new GetTeamStatisticsUseCase(
        teamRepository,
        teamActivityRepository
      );
      
      const result = await getTeamStatisticsUseCase.execute({ teamId });
      
      return unwrapResult(result);
    },
    enabled: (teamId) => !!teamId,
    staleTime: 300000, // 5 minuter
    errorContext: (teamId) => ({
      ...createTeamErrorContext('getTeamStatistics'),
      details: { teamId }
    })
  });
  
  /**
   * Skapar en ny teamaktivitet
   */
  const useCreateTeamActivity = createStandardizedMutation({
    mutationFn: async (dto: CreateTeamActivityDTO, updateProgress?: (progress: ProgressInfo) => void) => {
      const createTeamActivityUseCase = new CreateTeamActivityUseCase(
        teamActivityRepository,
        teamRepository,
        eventPublisher
      );
      
      updateProgress?.({ percent: 30, message: 'Skapar aktivitet...' });
      const result = await createTeamActivityUseCase.execute(dto);
      
      updateProgress?.({ percent: 100, message: 'Aktivitet skapad!' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera relevanta queries
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'statistics'] });
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('createTeamActivity'),
      details: { teamId: variables.teamId, type: variables.type }
    })
  });
  
  /**
   * Skapar ett nytt teammeddelande
   */
  const useCreateTeamMessage = createStandardizedMutation({
    mutationFn: async (dto: CreateTeamMessageDTO, updateProgress?: (progress: ProgressInfo) => void) => {
      const createTeamMessageUseCase = new CreateTeamMessageUseCase(
        teamRepository,
        eventPublisher
      );
      
      updateProgress?.({ percent: 40, message: 'Skapar meddelande...' });
      const result = await createTeamMessageUseCase.execute(dto);
      
      updateProgress?.({ percent: 100, message: 'Meddelande skapat!' });
      
      return unwrapResult(result);
    },
    onSuccess: (_, variables) => {
      // Invalidera team-messages i cachen
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'messages'] });
    },
    optimisticUpdate: {
      queryKey: ['team', (variables) => variables.teamId, 'messages'],
      updateFn: (oldData: any[], variables) => {
        if (!Array.isArray(oldData)) return oldData;
        
        // Skapa en optimistisk uppdatering - lägg till meddelandet optimistiskt
        return [
          {
            id: `temp-${Date.now()}`, // tillfälligt ID som kommer att ersättas när riktiga data kommer in
            content: variables.content,
            sender: variables.senderId,
            timestamp: new Date().toISOString(),
            isPending: true // flagga för att visa att det är en optimistisk uppdatering
          },
          ...oldData
        ];
      }
    },
    errorContext: (variables) => ({
      ...createTeamErrorContext('createTeamMessage'),
      details: { teamId: variables.teamId, senderId: variables.senderId }
    })
  });
  
  return {
    // Grundläggande teamoperationer
    useTeamById,
    useUserTeams,
    useCreateTeam,
    
    // Medlemshantering
    useAddTeamMember,
    useRemoveTeamMember,
    useUpdateTeamMemberRole,
    useInviteTeamMember,
    
    // Aktiviteter och statistik
    useTeamStatistics,
    useCreateTeamActivity,
    useCreateTeamMessage
  };
} 