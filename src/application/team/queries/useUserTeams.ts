import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@/infrastructure/supabase/hooks/useSupabase';
import { EventBus } from '@/shared/core/EventBus';
import { SupabaseUserRepository } from '@/infrastructure/supabase/repositories/UserRepository';
import { SupabaseTeamRepository } from '@/infrastructure/supabase/repositories/TeamRepository';
import { UniqueId } from '@/shared/core/UniqueId';
import { TeamDto } from '../dto/TeamDto';

export const useUserTeams = (userId: string) => {
  const supabase = useSupabase();
  const eventBus = new EventBus();
  
  const userRepo = new SupabaseUserRepository(supabase, eventBus);
  const teamRepo = new SupabaseTeamRepository(supabase, eventBus);

  return useQuery({
    queryKey: ['user', userId, 'teams'],
    queryFn: async (): Promise<TeamDto[]> => {
      const userResult = await userRepo.findById(new UniqueId(userId));
      if (userResult.isErr()) {
        throw new Error(userResult.error);
      }

      const user = userResult.value;
      const teamsResult = await teamRepo.findByIds(user.teamIds);
      if (teamsResult.isErr()) {
        throw new Error(teamsResult.error);
      }

      return teamsResult.value.map(team => ({
        id: team.id.toString(),
        name: team.name,
        description: team.description,
        ownerId: team.ownerId.toString(),
        members: team.members.map(member => ({
          id: member.userId.toString(),
          name: '', // Hämtas från användardata
          email: '', // Hämtas från användardata
          role: member.role,
          joinedAt: member.joinedAt.toISOString()
        })),
        invitations: team.invitations.map(invitation => ({
          id: invitation.userId.toString(),
          userId: invitation.userId.toString(),
          userName: '', // Hämtas från användardata
          userEmail: '', // Hämtas från användardata
          invitedBy: invitation.invitedBy.toString(),
          status: invitation.status,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
          respondedAt: invitation.respondedAt?.toISOString()
        })),
        createdAt: team.props.createdAt.toISOString(),
        updatedAt: team.props.updatedAt.toISOString()
      }));
    }
  });
}; 