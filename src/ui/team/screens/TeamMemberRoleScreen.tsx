import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Text, IconButton, Appbar, Snackbar, Banner, Portal } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { TeamPermissionManager } from '../components/TeamPermissionManager';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useTeamMember } from '@/application/team/hooks/useTeamMember';
import { useUser } from '@/application/user/hooks/useUser';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { useUpdateTeamMemberRole } from '@/application/team/hooks/useUpdateTeamMemberRole';

/**
 * Skärm för att hantera roller och behörigheter för en teammedlem
 * Endast teamägare och administratörer har tillgång till denna skärm
 */
export default function TeamMemberRoleScreen() {
  const router = useRouter();
  const { teamId, userId } = useLocalSearchParams<{ teamId: string; userId: string }>();
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
  
  // State
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
  
  // Laddar
  const isLoading = isCurrentUserLoading || isTeamLoading || isMemberLoading;
  
  // Visa felmeddelande om användaren inte har behörighet
  if (!isLoading && !hasManageRolesPermission()) {
    return (
      <Screen>
        <Stack.Screen options={{ 
          title: 'Behörighetshantering',
          headerRight: () => null
        }} />
        
        <View style={styles.centerContainer}>
          <Banner
            visible={true}
            icon="alert"
          >
            Du har inte behörighet att hantera teammedlemsroller.
          </Banner>
        </View>
      </Screen>
    );
  }
  
  // Visa felmeddelande om teamet eller medlemmen inte hittades
  if (!isLoading && (!team || !member)) {
    return (
      <Screen>
        <Stack.Screen options={{ 
          title: 'Team/Medlem hittades inte',
          headerRight: () => null
        }} />
        
        <View style={styles.centerContainer}>
          <Banner
            visible={true}
            icon="alert"
          >
            Teamet eller medlemmen hittades inte.
          </Banner>
        </View>
      </Screen>
    );
  }
  
  return (
    <Screen>
      <Stack.Screen options={{ 
        title: member ? `Behörigheter: ${member.userId.toString()}` : 'Behörighetshantering',
        headerRight: () => (
          hasChanges ? (
            <View style={styles.headerButtonContainer}>
              <IconButton
                icon="close"
                onPress={handleCancel}
                disabled={isUpdating}
              />
              <IconButton
                icon="content-save"
                onPress={handleSave}
                disabled={isUpdating}
              />
            </View>
          ) : null
        )
      }} />
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Laddar team och medlem...</Text>
        </View>
      ) : team && member ? (
        <View style={styles.container}>
          {hasChanges && (
            <Banner
              visible={true}
              actions={[
                { label: 'Avbryt', onPress: handleCancel },
                { label: 'Spara', onPress: handleSave }
              ]}
              icon="information"
            >
              Det finns osparade ändringar för medlemmens roll/behörigheter.
            </Banner>
          )}
          
          <TeamPermissionManager
            team={team}
            member={member}
            onRoleChange={handleRoleChange}
            onCustomPermissionsChange={handleCustomPermissionsChange}
            allowCustomPermissions={true}
            readOnly={isUpdating}
          />
        </View>
      ) : null}
      
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerButtonContainer: {
    flexDirection: 'row',
  },
}); 