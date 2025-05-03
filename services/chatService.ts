import { supabase } from '@/lib/supabase';
import { TeamMember, TeamRole } from '@/types/team';

class ChatService {
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data: teamMembers, error } = await supabase
        .from('team_members_with_profiles')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;

      if (!teamMembers) return [];

      return teamMembers.map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as TeamRole,
        joined_at: member.joined_at,
        profile: {
          id: member.user_id,
          name: member.name || 'Okänd användare',
          avatar_url: member.avatar_url,
        }
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Kunde inte hämta teammedlemmar');
    }
  }

  async searchTeamMembers(teamId: string, query: string): Promise<TeamMember[]> {
    try {
      const { data: teamMembers, error } = await supabase
        .from('team_members_with_profiles')
        .select('*')
        .eq('team_id', teamId)
        .ilike('name', `%${query}%`);

      if (error) throw error;

      if (!teamMembers) return [];

      return teamMembers.map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as TeamRole,
        joined_at: member.joined_at,
        profile: {
          id: member.user_id,
          name: member.name || 'Okänd användare',
          avatar_url: member.avatar_url,
        }
      }));
    } catch (error) {
      console.error('Error searching team members:', error);
      throw new Error('Kunde inte söka efter teammedlemmar');
    }
  }
}

export const chatService = new ChatService(); 