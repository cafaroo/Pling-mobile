import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Text, IconButton, Appbar, Snackbar, Banner, Card, Portal } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { PermissionManager } from '../components/PermissionManager';
import { useUser } from '@/application/user/hooks/useUser';
import { UserRole } from '@/domain/user/value-objects/UserRole';
import { UserPermission } from '@/domain/user/value-objects/UserPermission';
import { useUpdateUserPermissions } from '@/application/user/hooks/useUpdateUserPermissions';

/**
 * Skärm för att hantera behörigheter för en specifik användare
 * Endast administratörer har tillgång till denna skärm
 */
export default function PermissionManagementScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: currentUser, isLoading: isCurrentUserLoading } = useUser();
  const { data: targetUser, isLoading: isTargetUserLoading } = useUser({ userId });
  const { mutate: updatePermissions, isLoading: isUpdating, isSuccess, isError, error } = useUpdateUserPermissions();
  
  // State
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [customPermissions, setCustomPermissions] = useState<UserPermission[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Ladda användarens roller och behörigheter när data finns tillgänglig
  useEffect(() => {
    if (targetUser) {
      setSelectedRoles(targetUser.roles || []);
      setCustomPermissions(targetUser.customPermissions || []);
    }
  }, [targetUser]);
  
  // Kontrollera om nuvarande användare har administratörsbehörighet
  const hasAdminPermission = currentUser?.hasPermission('manage_users') || false;
  
  // Hantera roller ändrade
  const handleRolesChange = useCallback((roles: UserRole[]) => {
    setSelectedRoles(roles);
    setHasChanges(true);
  }, []);
  
  // Hantera anpassade behörigheter ändrade
  const handleCustomPermissionsChange = useCallback((permissions: UserPermission[]) => {
    setCustomPermissions(permissions);
    setHasChanges(true);
  }, []);
  
  // Spara ändringar
  const handleSave = useCallback(() => {
    if (!targetUser || !userId) return;
    
    updatePermissions({
      userId,
      roles: selectedRoles.map(role => role.name),
      customPermissions: customPermissions.map(permission => permission.name)
    }, {
      onSuccess: () => {
        setSnackbarMessage('Behörigheter uppdaterade');
        setSnackbarVisible(true);
        setHasChanges(false);
      },
      onError: (error: any) => {
        setSnackbarMessage(`Fel: ${error?.message || 'Kunde inte uppdatera behörigheter'}`);
        setSnackbarVisible(true);
      }
    });
  }, [userId, targetUser, selectedRoles, customPermissions, updatePermissions]);
  
  // Hantera avbryt
  const handleCancel = useCallback(() => {
    if (targetUser) {
      setSelectedRoles(targetUser.roles || []);
      setCustomPermissions(targetUser.customPermissions || []);
      setHasChanges(false);
    }
  }, [targetUser]);
  
  // Laddar
  const isLoading = isCurrentUserLoading || isTargetUserLoading;
  
  // Visa felmeddelande om användaren inte har behörighet
  if (!isLoading && !hasAdminPermission) {
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
            Du har inte behörighet att hantera användarbehörigheter.
          </Banner>
        </View>
      </Screen>
    );
  }
  
  // Visa felmeddelande om användaren inte hittades
  if (!isLoading && !targetUser) {
    return (
      <Screen>
        <Stack.Screen options={{ 
          title: 'Användare hittades inte',
          headerRight: () => null
        }} />
        
        <View style={styles.centerContainer}>
          <Banner
            visible={true}
            icon="alert"
          >
            Användaren hittades inte eller är inte tillgänglig.
          </Banner>
        </View>
      </Screen>
    );
  }
  
  return (
    <Screen>
      <Stack.Screen options={{ 
        title: targetUser ? `Behörigheter: ${targetUser.profile.displayName || userId}` : 'Behörighetshantering',
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
          <Text style={styles.loadingText}>Laddar användare...</Text>
        </View>
      ) : targetUser ? (
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
              Det finns osparade ändringar. Spara för att bekräfta ändringarna.
            </Banner>
          )}
          
          <PermissionManager
            user={targetUser}
            onRolesChange={handleRolesChange}
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