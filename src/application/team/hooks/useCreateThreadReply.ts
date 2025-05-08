import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { Result } from '@/domain/core/Result';
import { TeamMessage } from '@/domain/team/entities/TeamMessage';
import { CreateThreadReplyUseCase, CreateThreadReplyUseCaseProps } from '../useCases/createThreadReplyUseCase';
import { TeamMessageRepository } from '@/domain/team/repositories/TeamMessageRepository'; // Importerad för mock/placeholder
import { SupabaseTeamMessageRepository } from '@/infrastructure/supabase/repositories/SupabaseTeamMessageRepository';
import { eventBus } from '@/infrastructure/events/EventBus'; // Assuming eventBus is singleton or easily accessible

// Funktion för att få en instans av use caset
// Detta bör anpassas till er applikations dependency injection-strategi.
const getCreateThreadReplyUseCase = (): CreateThreadReplyUseCase => {
  // Detta är ett exempel på direkt instansiering. 
  // I en större applikation hanteras detta oftast mer centraliserat.
  if (!(globalThis as any).createThreadReplyUseCaseInstance) {
    const teamMessageRepository = new SupabaseTeamMessageRepository(eventBus);
    (globalThis as any).createThreadReplyUseCaseInstance = new CreateThreadReplyUseCase(teamMessageRepository);
  }
  return (globalThis as any).createThreadReplyUseCaseInstance as CreateThreadReplyUseCase;
};

type UseCreateThreadReplyMutationOptions = UseMutationOptions<
  Result<TeamMessage, string>, // Typen som mutationFn returnerar
  Error, // Typ för felet
  CreateThreadReplyUseCaseProps // Typ för variabler som skickas till mutationFn
>;

export const useCreateThreadReply = (options?: UseCreateThreadReplyMutationOptions) => {
  const queryClient = useQueryClient();
  const createThreadReplyUseCase = getCreateThreadReplyUseCase();

  return useMutation<
    Result<TeamMessage, string>,
    Error,
    CreateThreadReplyUseCaseProps
  >(
    (props: CreateThreadReplyUseCaseProps) => createThreadReplyUseCase.execute(props),
    {
      ...options,
      onSuccess: (result, variables, context) => {
        if (result.isOk()) {
          // Invalidera queries som kan påverkas av ett nytt trådsvar
          // 1. Meddelanden i tråden (om den är cachad och identifieras med parentId)
          queryClient.invalidateQueries(['teamMessages', variables.teamId, 'thread', variables.parentId]);
          
          // 2. Föräldrameddelandet (för att uppdatera dess threadReplyCount i huvudlistan)
          // Detta kan göras genom att invalidera en query som specifikt hämtar föräldrameddelandet,
          // eller mer generellt, listan där föräldrameddelandet visas.
          // Om föräldrameddelandet är en del av en större lista, kan den listans query key användas.
          // Exempel: Invalidera listan av meddelanden för teamet.
          queryClient.invalidateQueries(['teamMessages', variables.teamId]);

          // Om ni har en specifik query för enskilda meddelanden som kan innehålla `threadReplyCount`:
          // queryClient.invalidateQueries(['teamMessage', variables.parentId]);
        }
        options?.onSuccess?.(result, variables, context);
      },
      onError: (error, variables, context) => {
        // Global felhantering eller specifik loggning kan läggas här
        console.error('Error creating thread reply:', error);
        options?.onError?.(error, variables, context);
      },
    }
  );
}; 