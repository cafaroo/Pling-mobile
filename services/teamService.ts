import { supabase } from './supabaseClient';
import { Team, TeamMember, TeamInvitation, TeamRanking, Organization } from '@/types';

// 6-character alphanumeric code validation regex
const INVITE_CODE_REGEX = /^[A-Z0-9]{6}$/;

// Get pending team members
export const getPendingTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_pending_team_members', { team_id: teamId });

    if (error) throw error;
    
    return data.map((member: any) => ({
      id: member.id,
      teamId,
      userId: member.user_id,
      role: member.role,
      approvalStatus:member.approval_status,
      createdAt: member.created_at,
      user: {
        id: member.user_id,
        name: member.user_name,
        email: member.user_email,
        avatarUrl: member.user_avatar_url
      }
    }));
  } catch (error) {
    console.error('Error getting pending team members:', error);
    return [];
  }
};

// Approve or reject team member
export const approveTeamMember = async (teamId: string, userId: string, approve: boolean = true): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('approve_team_member', {
        team_id: teamId,
        user_id: userId,
        approve: approve
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error ${approve ? 'approving' : 'rejecting'} team member:`, error);
    return false;
  }
};

// Get team invite code
export const createTeamInviteCode = async (teamId: string): Promise<{ code: string; expiresAt: string } | null> => {
  try {
    const { data, error } = await supabase.rpc('create_team_invite_code', {
      team_id_param: teamId
    });

    if (error) {
      console.error('Error creating team invite code:', error);
      return null;
    }
    
    if (!data || !data[0]) {
      console.error('No invite code data returned');
      return null;
    }

    return {
      code: data[0].code,
      expiresAt: data[0].expires_at
    };
  } catch (error) {
    console.error('Error creating team invite code:', error);
    return null;
  }
};

// Join team with invite code
export const joinTeamWithCode = async (code: string): Promise<boolean> => {
  try {
    // Call the join_team_with_code RPC function
    const { data, error } = await supabase.rpc('join_team_with_code', { 
      invite_code: code.trim().toUpperCase() 
    });

    if (error) throw error;
    
    // Check if the operation was successful
    if (data && typeof data === 'object' && 'success' in data) {
      return data.success;
    }
    
    return false;
  } catch (error) {
    console.error('Error joining team with code:', error);
    return false;
  }
};

// Accept team invitation
export const acceptTeamInvitation = async (token: string, userId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('process_team_invitation', { 
        token: token,
        user_id: userId || undefined
      });

    if (error) throw error;
    
    if (data && typeof data === 'object' && 'success' in data) {
      return data.success;
    }
    return false;
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    return false;
  }
};

// Get team invitation
export const getTeamInvitation = async (email: string): Promise<TeamInvitation | null> => {
  try {
    if (!email) return null;
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        team_id,
        email,
        role,
        token,
        expires_at,
        created_at,
        teams (
          name
        )
      `)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      teamId: data.team_id,
      teamName: data.teams.name,
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error getting team invitation:', error);
    return null;
  }
};

// Get user's team
export const getUserTeam = async (userId: string): Promise<Team | null> => {
  try {
    // Get team membership
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError) {
      console.error('Error fetching team membership:', memberError);
      return null;
    }

    if (!memberData?.teams) {
      return null;
    }

    // Get team members
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        user_id,
        role,
        approval_status,
        created_at,
        profiles (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('team_id', memberData.teams.id);

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return null;
    }

    // Format team data
    const team: Team = {
      id: memberData.teams.id,
      name: memberData.teams.name,
      createdAt: memberData.teams.created_at,
      updatedAt: memberData.teams.updated_at,
      members: membersData.map((member: any) => ({
        id: member.id,
        teamId: member.team_id,
        userId: member.user_id,
        role: member.role,
        approvalStatus: member.approval_status,
        createdAt: member.created_at,
        user: member.profiles ? {
          id: member.profiles.id,
          name: member.profiles.name,
          email: member.profiles.email,
          avatarUrl: member.profiles.avatar_url,
        } : undefined,
      })),
    };

    return team;
  } catch (error) {
    console.error('Error in getUserTeam:', error);
    return null;
  }
};

// Create a new team
export const createTeam = async (name: string, userId: string): Promise<Team | null> => {
  try {
    // Start a transaction
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add creator as team leader
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'leader',
      });

    if (memberError) throw memberError;

    return {
      id: team.id,
      name: team.name,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
      members: [{
        id: '', // Will be set by the database
        teamId: team.id,
        userId: userId,
        role: 'leader',
        approvalStatus: 'approved',
        createdAt: new Date().toISOString(),
      }],
    };
  } catch (error) {
    console.error('Error creating team:', error);
    return null;
  }
};

// Generate a secure random token
const generateInvitationToken = (): string => {
  // Generate a random token using timestamp and random numbers
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2);
  return `${timestamp}-${randomPart}`;
};

// Add member to team
const addTeamMember = async (teamId: string, email: string, role: string = 'member'): Promise<{ member: TeamMember | null; error: string | null }> => {
  try {
    // Call the handle_team_invitation RPC function
    const { data, error } = await supabase
      .rpc('handle_team_invitation', {
        team_id: teamId,
        email: email.toLowerCase().trim(),
        role: role
      });

    if (error) {
      throw error;
    }

    if (!data.success) {
      return { member: null, error: data.message };
    }

    // If user was added directly
    if (data.type === 'direct_add') {
      // Get the newly added member details
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          created_at,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .eq('user_id', data.user_id)
        .single();

      if (memberError) {
        throw memberError;
      }

      const newMember: TeamMember = {
        id: member.id,
        teamId: member.team_id,
        userId: member.user_id,
        role: member.role,
        approvalStatus: member.approval_status,
        createdAt: member.created_at,
        user: member.profiles ? {
          id: member.profiles.id,
          name: member.profiles.name,
          email: member.profiles.email,
          avatarUrl: member.profiles.avatar_url,
        } : undefined,
      };

      return { member: newMember, error: null };
    }

    // If invitation was created
    if (data.type === 'invitation') {
      return { member: null, error: 'Invitation sent to ' + email };
    }

    // Unexpected response
    return { 
      member: null, 
      error: 'An unexpected error occurred'
    };
  } catch (error) {
    console.error('Error adding team member:', error);
    return { 
      member: null, 
      error: 'An unexpected error occurred'
    };
  }
};

// Remove member from team
export const removeTeamMember = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing team member:', error);
    return false;
  }
};

// Update team name
export const updateTeamName = async (teamId: string, name: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ name })
      .eq('id', teamId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating team name:', error);
    return false;
  }
};

// Get team ranking based on total sales
export const getTeamRanking = async (teamId: string): Promise<TeamRanking | null> => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Get current week's sales for all teams
    const { data: teamSales, error: salesError } = await supabase
      .from('sales')
      .select(`
        amount,
        team_id,
        teams (
          id,
          name
        )
      `)
      .gte('created_at', startOfWeek.toISOString())
      .not('team_id', 'is', null);

    if (salesError) throw salesError;

    // Calculate team totals
    const teamTotals = teamSales.reduce((acc, sale) => {
      const teamId = sale.team_id;
      if (!acc[teamId]) {
        acc[teamId] = {
          teamId,
          teamName: sale.teams.name,
          totalAmount: 0
        };
      }
      acc[teamId].totalAmount += sale.amount;
      return acc;
    }, {} as Record<string, { teamId: string; teamName: string; totalAmount: number; }>);

    // Convert to array and sort by amount
    const rankings = Object.values(teamTotals)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Find current team's ranking
    const currentTeam = rankings.find(r => r.teamId === teamId);
    if (!currentTeam) return null;

    const currentRank = rankings.findIndex(r => r.teamId === teamId) + 1;

    // Get previous week's rankings
    const previousStartDate = new Date(startOfWeek);
    previousStartDate.setDate(previousStartDate.getDate() - 7);

    const { data: previousSales, error: previousError } = await supabase
      .from('sales')
      .select('amount, team_id')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startOfWeek.toISOString())
      .not('team_id', 'is', null);

    if (previousError) throw previousError;

    // Calculate previous rankings
    const previousTotals = previousSales.reduce((acc, sale) => {
      acc[sale.team_id] = (acc[sale.team_id] || 0) + sale.amount;
      return acc;
    }, {} as Record<string, number>);

    const previousRankings = Object.entries(previousTotals)
      .sort(([, a], [, b]) => b - a);

    const previousRank = previousRankings.findIndex(([id]) => id === teamId) + 1;

    return {
      teamId: currentTeam.teamId,
      teamName: currentTeam.teamName,
      rank: currentRank,
      totalAmount: currentTeam.totalAmount,
      positionChange: previousRank === 0 ? 0 : previousRank - currentRank
    };
  } catch (error) {
    console.error('Error in getTeamRanking:', error);
    return null;
  }
};

// Get user's organizations
export const getUserOrganizations = async (userId: string): Promise<Organization[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_organizations', { user_id: userId });

    if (error) throw error;
    
    return data.map((org: any) => ({
      id: org.id,
      name: org.name,
      role: org.role,
      teamCount: org.team_count,
      createdAt: org.created_at,
      updatedAt: org.updated_at
    }));
  } catch (error) {
    console.error('Error getting user organizations:', error);
    return [];
  }
};

// Create a new organization
export const createOrganization = async (name: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .rpc('create_organization', { name });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating organization:', error);
    return null;
  }
};

// Get organization teams
export const getOrganizationTeams = async (organizationId: string): Promise<Team[]> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        organization_id
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;
    
    // Get team members for each team
    const teamsWithMembers = await Promise.all(data.map(async (team: any) => {
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          created_at,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('team_id', team.id);

      if (membersError) {
        console.error('Error fetching team members:', membersError);
        return {
          id: team.id,
          name: team.name,
          createdAt: team.created_at,
          updatedAt: team.updated_at,
          organizationId: team.organization_id,
          members: []
        };
      }

      return {
        id: team.id,
        name: team.name,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        organizationId: team.organization_id,
        members: members.map((member: any) => ({
          id: member.id,
          teamId: member.team_id,
          userId: member.user_id,
          role: member.role,
          approvalStatus: member.approval_status,
          createdAt: member.created_at,
          user: member.profiles ? {
            id: member.profiles.id,
            name: member.profiles.name,
            email: member.profiles.email,
            avatarUrl: member.profiles.avatar_url,
          } : undefined,
        }))
      };
    }));

    return teamsWithMembers;
  } catch (error) {
    console.error('Error getting organization teams:', error);
    return [];
  }
};

// Add team to organization
const addTeamToOrganization = async (teamId: string, organizationId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('add_team_to_organization', { 
        team_id: teamId, 
        organization_id: organizationId 
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding team to organization:', error);
    return false;
  }
};

// Promote team member to owner
export const promoteToTeamOwner = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('promote_to_team_owner', { 
        team_id: teamId, 
        user_id: userId 
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error promoting to team owner:', error);
    return false;
  }
};

// Change team member role
export const changeTeamMemberRole = async (teamId: string, userId: string, newRole: 'member' | 'leader'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error changing team member role:', error);
    return false;
  }
};