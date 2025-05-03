import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Team, TeamMember, TeamRole, TeamSettings, TeamInvitation, CreateTeamInvitationInput } from '@/types/team';
import { Profile } from '@/types/profile';
import { TeamServiceResponse } from '@/types/service';
import { Database } from '@/lib/database.types';

/**
 * Standardiserad felhantering för teamService
 */
const handleError = (error: unknown, message: string): TeamServiceResponse<never> => {
  return {
    success: false,
    error: {
      message,
      details: error
    }
  };
};

const defaultTeamSettings: TeamSettings = {
  allowInvites: true,
  maxMembers: 50,
  requireAdminApproval: true,
  notificationPreferences: {
    newMembers: true,
    chatMessages: true,
    teamUpdates: true,
    mentions: true,
  },
  privacy: {
    isPublic: false,
    allowMemberInvites: false,
    showMemberList: true,
  },
};

/**
 * Skapar ett nytt team
 * @param data Information om teamet som ska skapas
 * @returns Team-objekt om framgångsrikt, annars ett fel
 */
export const createTeam = async (data: {
  name: string;
  description?: string;
  organization_id?: string;
  settings?: Partial<TeamSettings>;
}): Promise<TeamServiceResponse<Team>> => {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: data.name,
        description: data.description,
        organization_id: data.organization_id,
        settings: { ...defaultTeamSettings, ...data.settings },
        status: 'active',
        max_members: data.settings?.maxMembers || 50,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: team };
  } catch (error) {
    return handleError(error, 'createTeam');
  }
};

/**
 * Hämtar ett team med dess medlemmar
 * @param teamId ID för teamet som ska hämtas
 * @returns Team-objekt med medlemmar om framgångsrikt, annars ett fel
 */
export const getTeam = async (teamId: string): Promise<TeamServiceResponse<Team>> => {
  try {
    // Hämta team data
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    // Hämta team members med profiler
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*, user:profiles(id, name, avatar_url)')
      .eq('team_id', teamId);

    if (membersError) throw membersError;

    return {
      success: true,
      data: {
        ...team,
        team_members: members || [],
      }
    };
  } catch (error) {
    return handleError(error, 'getTeam');
  }
};

/**
 * Uppdaterar ett team
 * @param teamId ID för teamet som ska uppdateras
 * @param data Ny data för teamet
 * @returns Det uppdaterade team-objektet om framgångsrikt, annars ett fel
 */
export const updateTeam = async (
  teamId: string,
  data: Partial<Team>
): Promise<TeamServiceResponse<Team>> => {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .update(data)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: team };
  } catch (error) {
    return handleError(error, 'updateTeam');
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) throw new Error('Failed to delete team');
  } catch (error) {
    throw handleError(error, 'deleteTeam');
  }
};

export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  try {
    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profile: profiles (*)
      `)
      .eq('team_id', teamId);

    if (error) throw new Error('Failed to fetch team members');
    return members || [];
  } catch (error) {
    throw handleError(error, 'getTeamMembers');
  }
};

export const addTeamMember = async (
  teamId: string,
  userId: string,
  role: TeamRole = 'member',
  status: TeamMember['status'] = 'invited'
): Promise<TeamMember> => {
  try {
    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        status,
      })
      .select(`
        *,
        profile: profiles (*)
      `)
      .single();

    if (error) throw new Error('Failed to add team member');
    return member;
  } catch (error) {
    throw handleError(error, 'addTeamMember');
  }
};

export const updateTeamMemberRole = async (
  teamId: string,
  userId: string,
  role: TeamRole
): Promise<TeamMember> => {
  try {
    const { data: member, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select(`
        *,
        profile: profiles (*)
      `)
      .single();

    if (error) throw new Error('Failed to update member role');
    return member;
  } catch (error) {
    throw handleError(error, 'updateTeamMemberRole');
  }
};

/**
 * Uppdaterar statusen för en teammedlem
 * 
 * @param teamId - ID för teamet som medlemmen tillhör
 * @param userId - ID för användaren vars status ska uppdateras
 * @param status - Ny status för medlemmen (active, inactive, pending, invited)
 * @returns Det uppdaterade TeamMember-objektet om framgångsrikt, annars ett fel
 */
export const updateTeamMemberStatus = async (
  teamId: string,
  userId: string,
  status: TeamMember['status']
): Promise<TeamMember> => {
  try {
    const { data: member, error } = await supabase
      .from('team_members')
      .update({ status })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select(`
        *,
        profile: profiles (*)
      `)
      .single();

    if (error) throw new Error('Failed to update team member status');
    return member;
  } catch (error) {
    throw handleError(error, 'updateTeamMemberStatus');
  }
};

/**
 * Tar bort en medlem från ett team
 * 
 * @param teamId - ID för teamet som medlemmen ska tas bort från
 * @param userId - ID för användaren som ska tas bort
 * @returns Void om framgångsrikt, annars ett fel
 */
export const removeTeamMember = async (
  teamId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw new Error('Failed to remove team member');
  } catch (error) {
    throw handleError(error, 'removeTeamMember');
  }
};

/**
 * Skapar en inbjudningskod för ett team
 * 
 * @param teamId - ID för teamet som inbjudningskoden ska skapas för
 * @param expiresIn - Tid i sekunder tills koden upphör att gälla (standard: 7 dagar)
 * @returns En inbjudningskod om framgångsrikt, annars ett fel
 */
export const createTeamInviteCode = async (
  teamId: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 days in seconds
): Promise<string> => {
  try {
    // Generate a random code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Store the code in the database
    const { error } = await supabase.from('team_invite_codes').insert({
      team_id: teamId,
      code,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
    
    if (error) throw new Error('Failed to create invite code');
    return code;
  } catch (error) {
    throw handleError(error, 'createTeamInviteCode');
  }
};

/**
 * Låter en användare gå med i ett team med hjälp av en inbjudningskod
 * 
 * @param code - Inbjudningskoden för teamet
 * @param userId - ID för användaren som ska gå med i teamet
 * @returns Det skapade TeamMember-objektet om framgångsrikt, annars ett fel
 */
export const joinTeamWithCode = async (
  code: string,
  userId: string
): Promise<TeamMember> => {
  try {
    // Verify the code
    const { data: inviteCode, error: inviteError } = await supabase
      .from('team_invite_codes')
      .select('team_id, expires_at')
      .eq('code', code)
      .single();
    
    if (inviteError || !inviteCode) throw new Error('Invalid invite code');
    
    // Check if the code has expired
    if (new Date(inviteCode.expires_at) < new Date()) {
      throw new Error('Invite code has expired');
    }
    
    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', inviteCode.team_id)
      .eq('user_id', userId)
      .single();
    
    if (existingMember) throw new Error('User is already a member of this team');
    
    // Add the user to the team
    return await addTeamMember(
      inviteCode.team_id,
      userId,
      'member',
      'active' // Auto-approve when using invite code
    );
  } catch (error) {
    throw handleError(error, 'joinTeamWithCode');
  }
};

/**
 * Uppdaterar inställningarna för ett team
 * 
 * @param teamId - ID för teamet som ska uppdateras
 * @param settings - Partiella inställningar som ska uppdateras
 * @returns Det uppdaterade Team-objektet om framgångsrikt, annars ett fel
 */
export const updateTeamSettings = async (
  teamId: string,
  settings: Partial<TeamSettings>
): Promise<Team> => {
  try {
    // Fetch current settings
    const { data: currentTeam, error: fetchError } = await supabase
      .from('teams')
      .select('settings')
      .eq('id', teamId)
      .single();
    
    if (fetchError) throw new Error('Failed to fetch current team settings');
    
    // Merge current settings with updates
    const updatedSettings = {
      ...currentTeam.settings,
      ...settings,
      // Merge nested objects
      notificationPreferences: {
        ...(currentTeam.settings?.notificationPreferences || {}),
        ...(settings.notificationPreferences || {}),
      },
      privacy: {
        ...(currentTeam.settings?.privacy || {}),
        ...(settings.privacy || {}),
      },
    };
    
    // Update the settings
    const { data: team, error: updateError } = await supabase
      .from('teams')
      .update({ settings: updatedSettings })
      .eq('id', teamId)
      .select()
      .single();
    
    if (updateError) throw new Error('Failed to update team settings');
    return team;
  } catch (error) {
    throw handleError(error, 'updateTeamSettings');
  }
};

/**
 * Laddar upp en profilbild för ett team
 * 
 * @param teamId - ID för teamet som profilbilden ska laddas upp för
 * @param file - Filen som ska laddas upp
 * @returns URL till den uppladdade bilden om framgångsrikt, annars ett fel
 */
export const uploadTeamProfileImage = async (
  teamId: string,
  file: File
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${teamId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `team-avatars/${fileName}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('team-avatars')
      .upload(filePath, file);
    
    if (uploadError) throw new Error('Failed to upload team profile image');
    
    // Get the public URL
    const { data } = supabase.storage.from('team-avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    
    // Update the team with the new image URL
    await updateTeam(teamId, { profile_image: publicUrl });
    
    return publicUrl;
  } catch (error) {
    throw handleError(error, 'uploadTeamProfileImage');
  }
};

/**
 * Tar bort profilbilden för ett team
 * 
 * @param teamId - ID för teamet vars profilbild ska tas bort
 * @returns Det uppdaterade Team-objektet om framgångsrikt, annars ett fel
 */
export const removeTeamProfileImage = async (teamId: string): Promise<Team> => {
  try {
    // Get the current profile image path
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('profile_image')
      .eq('id', teamId)
      .single();
    
    if (fetchError) throw new Error('Failed to fetch team');
    
    if (team.profile_image) {
      // Extract the file name from the URL
      const fileName = team.profile_image.split('/').pop();
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('team-avatars')
        .remove([`team-avatars/${fileName}`]);
      
      if (deleteError) throw new Error('Failed to delete team profile image');
    }
    
    // Update the team to remove the profile image reference
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ profile_image: null })
      .eq('id', teamId)
      .select()
      .single();
    
    if (updateError) throw new Error('Failed to update team');
    
    return updatedTeam;
  } catch (error) {
    throw handleError(error, 'removeTeamProfileImage');
  }
};

/**
 * Hämtar alla team som en användare är medlem i
 * 
 * @param userId - ID för användaren vars team ska hämtas
 * @returns En lista med Team-objekt om framgångsrikt, annars ett fel
 */
export const getUserTeams = async (userId: string): Promise<TeamServiceResponse<Team[]>> => {
  try {
    type TeamMemberWithTeam = Database['public']['Tables']['team_members']['Row'] & {
      team: Database['public']['Tables']['teams']['Row']
    };

    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        team:teams (
          id,
          name,
          description,
          organization_id,
          created_by,
          created_at,
          updated_at,
          status,
          max_members,
          profile_image,
          settings
        ),
        id,
        team_id,
        user_id,
        role,
        status,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .returns<TeamMemberWithTeam[]>();

    if (error) throw error;

    if (!teamMembers) return { success: true, data: [] };

    // Hämta alla team_members för varje team
    const teams = await Promise.all(
      teamMembers.map(async (member) => {
        const { data: teamMembers, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id,
            team_id,
            user_id,
            role,
            status,
            created_at,
            updated_at,
            user:profiles (
              email,
              name,
              avatar_url
            )
          `)
          .eq('team_id', member.team.id);

        if (membersError) throw membersError;

        const team: Team = {
          id: member.team.id,
          name: member.team.name,
          description: member.team.description,
          organization_id: member.team.organization_id,
          created_by: member.team.created_by,
          created_at: member.team.created_at,
          updated_at: member.team.updated_at,
          status: member.team.status,
          max_members: member.team.max_members,
          profile_image: member.team.profile_image,
          settings: member.team.settings,
          team_members: teamMembers || []
        };

        return team;
      })
    );

    return { success: true, data: teams };
  } catch (error) {
    return handleError(error, 'getUserTeams');
  }
};

/**
 * Genererar en inbjudningskod för ett team
 * 
 * @param teamId - ID för teamet som inbjudningskoden ska genereras för
 * @returns En slumpmässig inbjudningskod om framgångsrikt, annars ett fel
 */
export const generateInviteCode = async (teamId: string): Promise<string> => {
  try {
    return await createTeamInviteCode(teamId);
  } catch (error) {
    throw handleError(error, 'generateInviteCode');
  }
};

/**
 * Accepterar en teaminbjudan
 * 
 * @param inviteId - ID för inbjudan som ska accepteras
 * @returns Void om framgångsrikt, annars ett fel
 */
export const acceptTeamInvite = async (inviteId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', inviteId);
      
    if (error) throw new Error('Failed to accept team invite');
  } catch (error) {
    throw handleError(error, 'acceptTeamInvite');
  }
};

/**
 * Avvisar en teaminbjudan
 * 
 * @param inviteId - ID för inbjudan som ska avvisas
 * @returns Void om framgångsrikt, annars ett fel
 */
export const declineTeamInvite = async (inviteId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', inviteId);
      
    if (error) throw new Error('Failed to decline team invite');
  } catch (error) {
    throw handleError(error, 'declineTeamInvite');
  }
};

/**
 * Avslutar ett medlemskap i ett team (användaren lämnar teamet)
 * 
 * @param teamId - ID för teamet som användaren vill lämna
 * @returns Void om framgångsrikt, annars ett fel
 */
export const cancelTeamMembership = async (teamId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('leave_team', { team_id: teamId });
    
    if (error) {
      throw new Error('Failed to leave team. If you are the owner, you must transfer ownership first.');
    }
  } catch (error) {
    throw handleError(error, 'cancelTeamMembership');
  }
};

/**
 * Hämtar väntande teammedlemmar (medlemmar som har status 'pending')
 * 
 * @param teamId - ID för teamet vars väntande medlemmar ska hämtas
 * @returns En lista med väntande TeamMember-objekt om framgångsrikt, annars ett fel
 */
export async function getPendingTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const { data: pendingMembers, error } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        user_id,
        role,
        status,
        created_at,
        updated_at,
        profile: profiles (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending');
      
    if (error) throw new Error('Failed to fetch pending team members');
    
    // Omforma data för att matcha TeamMember-typen
    return (pendingMembers || []).map(member => {
      // Säkerställ att profile är ett enskilt objekt, inte en array
      const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
      
      return {
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at,
        profile: profile || null,
        user: {
          id: member.user_id,
          email: profile?.email || '',
          created_at: member.created_at
        }
      };
    });
  } catch (error) {
    throw handleError(error, 'getPendingTeamMembers');
  }
}

/**
 * Hämtar en teaminbjudan baserat på e-postadress
 * 
 * @param email - E-postadress att söka efter inbjudan för
 * @returns TeamServiceResponse med TeamInvitation-objekt om det finns, annars null
 */
export const getTeamInvitation = async (email: string): Promise<TeamServiceResponse<TeamInvitation | null>> => {
  try {
    // Validera e-postadress
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: {
          message: 'Ogiltig e-postadress',
          details: 'E-postadressen måste vara ett giltigt format'
        }
      };
    }

    // Hämta aktiv inbjudan för e-postadressen
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team:teams (
          id,
          name,
          description,
          profile_image
        )
      `)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    // Om det blev ett fel som inte är relaterat till att inga rader hittades
    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: {
          message: 'Kunde inte hämta teaminbjudan',
          details: error
        }
      };
    }

    // Om vi inte fick någon data eller om arrayen är tom
    if (!data || data.length === 0) {
      return { success: true, data: null };
    }

    // Returnera första (och enda) inbjudan
    return { success: true, data: data[0] };
  } catch (error) {
    return handleError(error, 'getTeamInvitation');
  }
};

/**
 * Skapar en teaminbjudan och skickar den till den angivna e-postadressen
 * 
 * @param teamId - ID för teamet som inbjudan är för
 * @param input - Information om inbjudan (e-post, roll, etc.)
 * @returns Den skapade TeamInvitation om framgångsrikt, annars ett fel
 */
export const createTeamInvitation = async (
  teamId: string,
  input: CreateTeamInvitationInput
): Promise<TeamServiceResponse<TeamInvitation>> => {
  try {
    // Kontrollera om användaren redan är medlem i teamet
    if (input.user_id) { // Använd user_id istället för userId
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', input.user_id)
        .maybeSingle();

      if (existingMember) {
        return {
          success: false,
          error: {
            message: 'Användaren är redan medlem i teamet',
            details: 'Kan inte bjuda in en befintlig medlem'
          }
        };
      }
    }

    // Kontrollera om det redan finns en väntande inbjudan för denna e-post
    const { data: existingInvitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', input.email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvitation) {
      return {
        success: false,
        error: {
          message: 'Det finns redan en aktiv inbjudan för denna e-post',
          details: 'Kan inte skapa dubbla inbjudningar'
        }
      };
    }

    // Skapa token för inbjudan
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Beräkna utgångstid (7 dagar från nu)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Skapa inbjudan i databasen
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email: input.email.toLowerCase(),
        role: input.role || 'member',
        token,
        expires_at: expiresAt.toISOString(),
        created_by: input.created_by // Använd created_by istället för inviterId
      })
      .select(`
        *,
        team:teams (
          id,
          name,
          profile_image
        )
      `)
      .single();

    if (error) {
      return {
        success: false,
        error: {
          message: 'Kunde inte skapa inbjudan',
          details: error
        }
      };
    }

    // Här kan kod för att skicka inbjudningsmail läggas till

    return { success: true, data: invitation };
  } catch (error) {
    return handleError(error, 'createTeamInvitation');
  }
};