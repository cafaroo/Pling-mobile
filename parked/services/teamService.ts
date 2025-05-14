import { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';
import { supabase as realSupabase } from '@/lib/supabase';
// Importera typerna direkt från filerna med expliciit path
import { 
  Team, TeamMember, TeamRole, TeamSettings, 
  TeamInvitation, CreateTeamInvitationInput 
} from '../types/team';
import { Profile } from '../types/profile';
import { TeamServiceResponse, ServiceResponse } from '../types/service';
import { nanoid } from 'nanoid';
import { handleError } from '@utils/errorUtils';

// Gör supabase tillgänglig för mockning i tester
export let supabase = realSupabase;

// Funktion för att återställa supabase till dess ursprungliga värde
export const resetSupabase = () => {
  supabase = realSupabase;
};

// Funktion för att ersätta supabase med en mock i tester
export const setMockSupabase = (mockClient: any) => {
  supabase = mockClient;
};

function generateAlphaNumericCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

export interface CreateTeamParams {
  name: string;
  description?: string;
}

/**
 * Skapar ett nytt team
 * @param data Information om teamet som ska skapas
 * @returns Team-objekt om framgångsrikt, annars ett fel
 */
export const createTeam = async ({ name, description }: CreateTeamParams): Promise<ServiceResponse<Team>> => {
  try {
    // Hämta användarens ID från den aktiva sessionen
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Ingen användare inloggad');

    // Använd den säkra RPC-funktionen för att skapa team
    const { data: teamId, error: createTeamError } = await supabase.rpc(
      'create_team_secure',
      {
        name,
        description: description || null,
        user_id: user.id,
        settings: defaultTeamSettings
      }
    );

    if (createTeamError) throw createTeamError;

    // Hämta det skapade teamet
    const { data: team, error: getTeamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (getTeamError) throw getTeamError;

    return {
      success: true,
      data: team
    };
  } catch (error) {
    console.error('Error in createTeam:', error);
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
    console.log('Hämtar medlemmar för team:', teamId);
    
    // Använd vår nya RPC-funktion
    const { data: members, error } = await supabase
      .rpc('get_team_members_with_profiles', { 
        team_id_param: teamId 
      });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Kunde inte hämta teammedlemmar');
    }

    console.log('Rådata från Supabase:', JSON.stringify(members));

    if (!members || members.length === 0) {
      console.log('Inga medlemmar hittades');
      return [];
    }

    // Transformera data till rätt format med förbättrad felhantering och plattformsspecifik anpassning
    const transformedMembers = members.map((member: {
      id: string;
      team_id: string;
      user_id: string;
      role: string;
      status?: string;
      joined_at: string;
      name?: string;
      email?: string;
      avatar_url?: string;
      profile_id?: string;
    }, index: number) => {
      console.log(`Transformerar medlem ${index} (${member.id}):`, JSON.stringify(member));
      
      // Ta reda på om medlemmen har ett namn
      const hasName = !!member.name && member.name.trim() !== '';
      
      // Skapa ett förtydligat fallback-namn baserat på användar-ID eller index
      const fallbackName = member.user_id ? 
        `Användare-${member.user_id.substring(0, 4)}` : 
        `Medlem #${index + 1}`;
      
      // Logga tydligt vad som används som namn
      console.log(`Medlem ${index} namndetaljer:`, {
        id: member.id,
        originalName: member.name,
        hasName,
        fallbackName,
        finalName: hasName ? member.name : fallbackName
      });
      
      // Säkerställ att alla värden är korrekta, med tydliga fallbacks och plattformsoberoende struktur
      const transformedMember: TeamMember = {
        id: member.id || `missing-id-${index}`,
        team_id: member.team_id || teamId,
        user_id: member.user_id || `missing-user-${index}`,
        role: (member.role as TeamRole) || 'member',
        status: (member.status as TeamMember['status']) || 'active',
        created_at: member.joined_at || new Date().toISOString(),
        updated_at: member.joined_at || new Date().toISOString(),
        // Säkerställ att profilen är ett komplett objekt med alla nödvändiga egenskaper
        profile: {
          id: member.profile_id || member.user_id || `missing-user-${index}`,
          name: hasName ? member.name : fallbackName,
          email: member.email || '',
          avatar_url: member.avatar_url || undefined
        }
      };
      
      console.log(`Transformerad medlem ${index} (${member.id}):`, JSON.stringify(transformedMember.profile));
      return transformedMember;
    });

    console.log('Transformerade medlemmar:', transformedMembers.length);
    return transformedMembers;
  } catch (error) {
    console.error('Error in getTeamMembers:', error);
    throw error;
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

/**
 * Uppdaterar rollen för en teammedlem
 * 
 * @param teamIdOrMemberId - Antingen teamets ID eller medlems-ID beroende på andra parametern
 * @param newRoleOrUserId - Antingen den nya rollen eller användar-ID beroende på parametrarna
 * @param newRole - Den nya rollen (när teamId och userId används)
 * @returns Det uppdaterade TeamMember-objektet om framgångsrikt, annars ett fel
 */
export const updateTeamMemberRole = async (
  teamIdOrMemberId: string,
  newRoleOrUserId: TeamRole | string,
  newRole?: TeamRole
): Promise<TeamMember> => {
  try {
    // Bestäm vilken flöde vi använder baserat på om vi har en tredje parameter
    const isThreeParamVersion = newRole !== undefined;
    const actualTeamId = isThreeParamVersion ? teamIdOrMemberId : undefined;
    const actualUserId = isThreeParamVersion ? newRoleOrUserId as string : undefined;
    const actualMemberId = isThreeParamVersion ? undefined : teamIdOrMemberId;
    
    // Validera och bestäm den faktiska rollen som ska användas
    let actualNewRole: TeamRole;
    
    if (isThreeParamVersion) {
      // Om vi använder tre parametrar, använd explicit newRole
      if (!newRole || typeof newRole !== 'string') {
        console.error('Ogiltig newRole för tredje parametern:', newRole);
        throw new Error('En giltig roll måste anges som tredje parameter');
      }
      actualNewRole = newRole;
    } else {
      // Om vi använder två parametrar, tolka newRoleOrUserId som en roll
      if (typeof newRoleOrUserId === 'string' && ['owner', 'admin', 'member'].includes(newRoleOrUserId)) {
        actualNewRole = newRoleOrUserId as TeamRole;
      } else {
        console.error('Ogiltig roll i tvåparametersversion:', newRoleOrUserId);
        throw new Error(`Ogiltig roll: ${newRoleOrUserId}. Måste vara owner, admin eller member.`);
      }
    }

    console.log('Uppdaterar roll för medlem:', 
      isThreeParamVersion ? `teamId: ${actualTeamId}, userId: ${actualUserId}` : `memberId: ${actualMemberId}`, 
      'till:', actualNewRole);
    
    console.log('Parametrar:', { 
      teamIdOrMemberId, 
      newRoleOrUserId, 
      newRole, 
      isThreeParamVersion,
      actualNewRole,
      paramTyper: {
        teamIdOrMemberId: typeof teamIdOrMemberId,
        newRoleOrUserId: typeof newRoleOrUserId,
        newRole: typeof newRole
      }
    });

    // Validera rollen igen för säkerhets skull
    if (!actualNewRole) {
      throw new Error('En giltig roll måste anges');
    }
    
    if (!['owner', 'admin', 'member'].includes(actualNewRole)) {
      throw new Error(`Ogiltig roll: ${actualNewRole}. Måste vara owner, admin eller member.`);
    }

    let memberId: string;
    
    // Om vi använder tre parametrar, hitta medlems-ID
    if (isThreeParamVersion && actualTeamId && actualUserId) {
      const { data, error: memberIdError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', actualTeamId)
        .eq('user_id', actualUserId)
        .single();
      
      if (memberIdError) throw memberIdError;
      if (!data) throw new Error('Medlem hittades inte');
      
      memberId = data.id;
    } else {
      // Annars använd det tillhandahållna medlem-ID
      if (!actualMemberId) throw new Error('Medlem-ID saknas');
      memberId = actualMemberId;
    }
    
    // Använd den säkra RPC-funktionen för att uppdatera rollen
    const { data: updatedMember, error: updateError } = await supabase
      .rpc('update_team_member_role', {
        p_member_id: memberId,
        p_new_role: actualNewRole
      })
      .single();
    
    if (updateError) {
      console.error('Databasfel vid uppdatering av roll:', updateError);
      throw updateError;
    }
    
    if (!updatedMember) {
      throw new Error('Kunde inte uppdatera medlemmens roll');
    }
    
    // Hämta medlemmen med profildata
    const { data: memberWithProfile, error: profileError } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('id', memberId)
      .single();
      
    if (profileError) {
      console.warn('Kunde inte hämta profil efter rolluppdatering:', profileError);
      // Skapa ett nytt TeamMember-objekt med standard-värden istället för att försöka använda updatedMember
      return {
        id: memberId,
        team_id: isThreeParamVersion ? actualTeamId || '' : '',
        user_id: isThreeParamVersion ? actualUserId || '' : '',
        role: actualNewRole,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    console.log('Roll uppdaterad för medlem:', memberWithProfile || updatedMember);
    return memberWithProfile || updatedMember;
  } catch (error) {
    console.error('Error i updateTeamMemberRole:', error);
    throw error;
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
 * @param teamIdOrMemberId - Antingen teamets ID eller medlems-ID beroende på andra parametern
 * @param userId - Användar-ID (valfritt om teamIdOrMemberId är medlems-ID)
 * @returns Void om framgångsrikt, annars ett fel
 */
export const removeTeamMember = async (
  teamIdOrMemberId: string,
  userId?: string
): Promise<void> => {
  try {
    // Om vi har både teamId och userId, sök efter medlemmen och ta bort den
    if (userId) {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamIdOrMemberId)
        .eq('user_id', userId);

      if (error) throw new Error('Failed to remove team member');
    } 
    // Om vi bara har memberId, använd det för att hitta och ta bort medlemmen
    else {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', teamIdOrMemberId);

      if (error) throw new Error('Failed to remove team member');
    }
  } catch (error) {
    throw handleError(error, 'removeTeamMember');
  }
};

/**
 * Skapar en inbjudningskod för ett team
 * @param teamId - ID för teamet
 * @returns Ett löfte som innehåller inbjudningskoden eller ett felmeddelande
 */
const createTeamInviteCode = async (
  teamId: string
): Promise<TeamServiceResponse<string>> => {
  try {
    // Hämta användarens ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: {
          message: 'Kunde inte hämta användarinformation',
          details: userError?.message
        }
      };
    }

    // Kontrollera att teamet existerar
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return {
        success: false,
        error: {
          message: 'Kunde inte hitta teamet',
          details: teamError?.message
        }
      };
    }

    // Generera en unik kod
    let inviteCode;
    let exists = true;
    do {
      inviteCode = generateAlphaNumericCode(6);
      const { data } = await supabase
        .from('team_invite_codes')
        .select('id')
        .eq('code', inviteCode)
        .maybeSingle();
      exists = !!data;
    } while (exists);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Koden är giltig i 7 dagar

    // Spara koden i databasen
    const { error: insertError } = await supabase
      .from('team_invite_codes')
      .insert({
        team_id: teamId,
        code: inviteCode,
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      });

    if (insertError) {
      return {
        success: false,
        error: {
          message: 'Kunde inte skapa inbjudningskod',
          details: insertError.message
        }
      };
    }

    return {
      success: true,
      data: inviteCode
    };
  } catch (error) {
    return handleError(error, 'createTeamInviteCode');
  }
};

/**
 * Låter en användare gå med i ett team med hjälp av en inbjudningskod
 * 
 * @param code - Inbjudningskoden för teamet
 * @returns Det skapade TeamMember-objektet om framgångsrikt, annars ett fel
 */
export const joinTeamWithCode = async (code: string): Promise<{ success: boolean; message: string; team_id?: string; team_name?: string }> => {
  try {
    const { data, error } = await supabase.rpc('join_team_with_code', { invite_code: code.toUpperCase() });
    if (error) throw error;
    if (!data || !data.success) {
      throw new Error(data?.message || 'Kunde inte gå med i team');
    }
    return data;
  } catch (error: any) {
    return { success: false, message: error.message || 'Kunde inte gå med i team' };
  }
  // Fallback om något oväntat händer
  return { success: false, message: 'Kunde inte gå med i team (okänt fel)' };
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
    console.log('Anropar getUserTeams för userId:', userId);
    
    // Först hämtar vi användarens aktiva team_members
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      throw membersError;
    }

    if (!teamMembers || teamMembers.length === 0) {
      console.log('No teams found for user');
      return { success: true, data: [] };
    }

    const teamIds = teamMembers.map(tm => tm.team_id);
    console.log('Found team IDs:', teamIds);

    // Sedan hämtar vi team-information för dessa team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      throw teamsError;
    }

    // Slutligen hämtar vi alla medlemmar för dessa team
    const { data: allMembers, error: allMembersError } = await supabase
      .from('team_members')
      .select(`
        *,
        user:profiles (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .in('team_id', teamIds);

    if (allMembersError) {
      console.error('Error fetching all members:', allMembersError);
      throw allMembersError;
    }

    // Kombinera data
    const fullTeams = teams.map(team => ({
      ...team,
      team_members: allMembers?.filter(member => member.team_id === team.id) || []
    }));

    console.log('Successfully processed teams:', fullTeams.length);
    return { success: true, data: fullTeams };
  } catch (error) {
    console.error('Error in getUserTeams:', error);
    return handleError(error, 'getUserTeams');
  }
};

/**
 * Genererar en inbjudningskod för ett team
 * @param teamId - ID för teamet
 * @returns Ett löfte som innehåller inbjudningskoden eller ett felmeddelande
 */
const generateInviteCode = async (
  teamId: string
): Promise<TeamServiceResponse<string>> => {
  try {
    return await createTeamInviteCode(teamId);
  } catch (error) {
    return handleError(error, 'generateInviteCode');
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

/**
 * Hämtar användarens roll i ett specifikt team
 * @param teamId - ID för teamet
 * @returns Ett löfte som innehåller användarens roll
 */
export const getUserRole = async (teamId: string): Promise<TeamRole> => {
  try {
    const { data: role, error } = await supabase.rpc(
      'get_user_team_role',
      { target_team_id: teamId }
    );

    if (error) throw error;
    return role as TeamRole;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return 'member'; // Default till member om något går fel
  }
};

export async function getUserActiveTeam(): Promise<Team | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('Användaren är inte inloggad');
    }
    
    // Hämta användarens aktiva team (antingen från en inställning eller senast använda)
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, role, status, teams:team_id(*)')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Returnera team-objektet från relationen
    const teamData = data[0].teams;
    if (!teamData || typeof teamData !== 'object') {
      return null;
    }
    
    // Explicit typkonvertering med säkerhetscheck
    const team = teamData as unknown as Team;
    // Validera att teamet har förväntade egenskaper
    if (!team.id || !team.name) {
      console.warn('Returnerat team saknar nödvändiga egenskaper');
      return null;
    }
    
    return team;
  } catch (error) {
    console.error('Error fetching active team:', error);
    throw error;
  }
}

/**
 * Hämtar team ranking och statistik
 * @param teamId - ID för teamet
 * @returns Ett löfte som innehåller team ranking och statistik
 */
export const getTeamRanking = async (teamId: string) => {
  try {
    // Hämta team statistik
    const { data: stats } = await supabase.rpc('get_team_stats', { team_id: teamId });
    
    // Hämta team medlemmar
    const { data: members } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('status', 'active');

    // Hämta team försäljning
    const { data: sales } = await supabase
      .from('sales')
      .select('amount')
      .eq('team_id', teamId)
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

    const totalAmount = sales?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;
    
    return {
      rank: stats?.rank || 1,
      totalAmount,
      teamMembers: members?.length || 0,
      growth: stats?.growth || 0,
      competitions: stats?.competitions || 0
    };
  } catch (error) {
    console.error('Error getting team ranking:', error);
    // Returnera standardvärden om något går fel
    return {
      rank: 1,
      totalAmount: 0,
      teamMembers: 0,
      growth: 0,
      competitions: 0
    };
  }
};

/**
 * Hämtar användarens roll i ett team
 * @param teamId ID för teamet
 * @param userId ID för användaren
 * @returns Ett löfte som innehåller användarens roll i teamet
 */
export const getCurrentUserRole = async (
  teamId: string,
  userId: string
): Promise<ServiceResponse<TeamRole | null>> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .match({ team_id: teamId, user_id: userId })
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data ? data.role as TeamRole : null
    };
  } catch (error) {
    return handleError(error, 'getCurrentUserRole');
  }
};

const teamService = {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  updateTeamMemberStatus,
  removeTeamMember,
  createTeamInviteCode,
  joinTeamWithCode,
  updateTeamSettings,
  uploadTeamProfileImage,
  removeTeamProfileImage,
  getUserTeams,
  generateInviteCode,
  acceptTeamInvite,
  declineTeamInvite,
  cancelTeamMembership,
  getPendingTeamMembers,
  getTeamInvitation,
  createTeamInvitation,
  getUserRole,
  getUserActiveTeam,
  getTeamRanking,
  getCurrentUserRole
};

export default teamService;