import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team } from '@/types/team';
import { useUser } from './UserContext';
import { supabase } from '@/lib/supabase';

interface TeamContextType {
  teams: Team[];
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  isLoading: boolean;
  error: Error | null;
  refetchTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  teams: [],
  selectedTeam: null,
  setSelectedTeam: () => {},
  isLoading: false,
  error: null,
  refetchTeams: async () => {},
});

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*, team:teams(*)')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      const userTeams = teamMembers
        .map(member => member.team)
        .filter((team): team is Team => team !== null);

      setTeams(userTeams);
      
      // Om vi inte har ett valt team och har team tillgängliga, välj det första
      if (!selectedTeam && userTeams.length > 0) {
        setSelectedTeam(userTeams[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Kunde inte hämta team'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  // Prenumerera på team_members ändringar
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('team-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTeams();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <TeamContext.Provider 
      value={{
        teams,
        selectedTeam,
        setSelectedTeam,
        isLoading,
        error,
        refetchTeams: fetchTeams
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext måste användas inom en TeamProvider');
  }
  return context;
} 