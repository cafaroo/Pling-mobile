import React, { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useTeamMember } from '@/application/team/hooks/useTeamMember';
import { useUser } from '@/application/user/hooks/useUser';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { useUpdateTeamMemberRole } from '@/application/team/hooks/useUpdateTeamMemberRole';
import { TeamMemberRoleScreenPresentation } from './TeamMemberRoleScreenPresentation';

export const TeamMemberRoleScreenContainer: React.FC = () => {
  const router = useRouter();
  const { teamId, userId } = useLocalSearchParams<{ teamId: string; userId: string }>();
  
  // Hämta data från hooks
  const { data: currentUser, isLoading: isCurrentUserLoading } = useUser();
  const { data: team, isLoading: isTeamLoading } = useTeam({ teamId });
  const { data: member, isLoading: isMemberLoading } = useTeamMember({ teamId, userId });
  const { 
    mutate: updateMemberRole, 
    isLoading: isUpdating, 
    isSuccess, 
    isError, 
    error 
  } = useUpdateTeamMemberRole();
  
  // Lokalt tillstånd
  const [selectedRole, setSelectedRole] = useState<TeamRolePermission | undefined>();
  const [customPermissions, setCustomPermissions] = useState<TeamPermission[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Ladda medlemmens roll och behörigheter när data finns tillgänglig
  useEffect(() => {
    if (member && team) {
      const role = TeamRolePermission.create(
        member.role,
        member.customPermissions?.map(p => p.name) || []
      );
      setSelectedRole(role);
      setCustomPermissions(member.customPermissions || []);
    }
  }, [member, team]);
  
  // Kontrollera om den nuvarande användaren är teamägare eller admin
  const hasManageRolesPermission = useCallback(() => {
    if (!team || !currentUser) return false;
    
    // Kontrollera om nuvarande användare är ägare eller admin
    const currentMember = team.members.find(m => 
      m.userId.toString() === currentUser.id.toString()
    );
    
    return currentMember?.canManageRoles() || false;
  }, [team, currentUser]);
  
  // Hantera rollförändring
  const handleRoleChange = useCallback((role: TeamRolePermission) => {
    setSelectedRole(role);
    setHasChanges(true);
  }, []);
  
  // Hantera ändring av anpassade behörigheter
  const handleCustomPermissionsChange = useCallback((permissions: TeamPermission[]) => {
    setCustomPermissions(permissions);
    setHasChanges(true);
  }, []);
  
  // Spara ändringar
  const handleSave = useCallback(() => {
    if (!team || !member || !selectedRole || !teamId || !userId) return;
    
    updateMemberRole({
      teamId,
      userId,
      role: selectedRole.role,
      customPermissions: customPermissions.map(p => p.name)
    }, {
      onSuccess: () => {
        setSnackbarMessage('Teammedlemmens roll och behörigheter uppdaterade');
        setSnackbarVisible(true);
        setHasChanges(false);
      },
      onError: (error: any) => {
        setSnackbarMessage(`Fel: ${error?.message || 'Kunde inte uppdatera roll'}`);
        setSnackbarVisible(true);
      }
    });
  }, [teamId, userId, team, member, selectedRole, customPermissions, updateMemberRole]);
  
  // Hantera avbryt
  const handleCancel = useCallback(() => {
    if (member && team) {
      const role = TeamRolePermission.create(
        member.role,
        member.customPermissions?.map(p => p.name) || []
      );
      setSelectedRole(role);
      setCustomPermissions(member.customPermissions || []);
      setHasChanges(false);
    }
  }, [member, team]);
  
  // Stäng snackbar
  const handleDismissSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);
  
  // Sammanställ laddningstillstånd
  const isLoading = isCurrentUserLoading || isTeamLoading || isMemberLoading;
  
  return (
    <TeamMemberRoleScreenPresentation
      team={team}
      member={member}
      selectedRole={selectedRole}
      customPermissions={customPermissions}
      isLoading={isLoading}
      isUpdating={isUpdating}
      isSuccess={isSuccess}
      isError={isError}
      error={error}
      hasChanges={hasChanges}
      hasManageRolesPermission={hasManageRolesPermission()}
      snackbarVisible={snackbarVisible}
      snackbarMessage={snackbarMessage}
      onRoleChange={handleRoleChange}
      onCustomPermissionsChange={handleCustomPermissionsChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onDismissSnackbar={handleDismissSnackbar}
    />
  );
}; 