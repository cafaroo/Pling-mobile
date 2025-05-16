import React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Text, IconButton, Banner, Portal, Snackbar } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { TeamPermissionManager } from '../../components/TeamPermissionManager';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';

export interface TeamMemberRoleScreenPresentationProps {
  // Data
  team?: Team;
  member?: TeamMember;
  selectedRole?: TeamRolePermission;
  customPermissions: TeamPermission[];
  
  // Status
  isLoading: boolean;
  isUpdating: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: any;
  hasChanges: boolean;
  hasManageRolesPermission: boolean;
  
  // Snackbar
  snackbarVisible: boolean;
  snackbarMessage: string;
  
  // Callbacks
  onRoleChange: (role: TeamRolePermission) => void;
  onCustomPermissionsChange: (permissions: TeamPermission[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onDismissSnackbar: () => void;
}

export const TeamMemberRoleScreenPresentation: React.FC<TeamMemberRoleScreenPresentationProps> = ({
  team,
  member,
  selectedRole,
  customPermissions,
  isLoading,
  isUpdating,
  isSuccess,
  isError,
  error,
  hasChanges,
  hasManageRolesPermission,
  snackbarVisible,
  snackbarMessage,
  onRoleChange,
  onCustomPermissionsChange,
  onSave,
  onCancel,
  onDismissSnackbar
}) => {
  // Visa felmeddelande om användaren inte har behörighet
  if (!isLoading && !hasManageRolesPermission) {
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
                onPress={onCancel}
                disabled={isUpdating}
              />
              <IconButton
                icon="content-save"
                onPress={onSave}
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
                { label: 'Avbryt', onPress: onCancel },
                { label: 'Spara', onPress: onSave }
              ]}
              icon="information"
            >
              Det finns osparade ändringar för medlemmens roll/behörigheter.
            </Banner>
          )}
          
          <TeamPermissionManager
            team={team}
            member={member}
            onRoleChange={onRoleChange}
            onCustomPermissionsChange={onCustomPermissionsChange}
            allowCustomPermissions={true}
            readOnly={isUpdating}
          />
        </View>
      ) : null}
      
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={onDismissSnackbar}
          duration={3000}
          action={{
            label: 'OK',
            onPress: onDismissSnackbar,
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </Screen>
  );
};

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