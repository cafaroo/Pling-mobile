import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { UserPermissionManager } from '@/src/ui/user/components/UserPermissionManager';
import { useUser } from '@/hooks/useUser';
import { Container } from '@/components/ui/Container';
import { UserRolePermission } from '@/domain/user/value-objects/UserRolePermission';
import { UserPermission } from '@/domain/user/value-objects/UserPermission';
import { useUpdateUserPermissions } from '@/src/ui/user/hooks/useUpdateUserPermissions';

/**
 * Skärm för att hantera användarbehörigheter
 */
export default function UserPermissionsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const theme = useTheme();
  const router = useRouter();
  
  // Hämta användardata
  const { user, isLoading, error } = useUser(userId);
  
  // State för valda behörigheter
  const [selectedRole, setSelectedRole] = useState<UserRolePermission | null>(null);
  const [customPermissions, setCustomPermissions] = useState<UserPermission[]>([]);
  
  // Hook för att uppdatera användarbehörigheter
  const { 
    updatePermissions, 
    isUpdating, 
    error: updateError 
  } = useUpdateUserPermissions();
  
  // Uppdatera state när användardata laddats
  useEffect(() => {
    if (user && user.role) {
      // Skapa en rollobjekt baserat på användarens roll
      const role = UserRolePermission.create(user.role.value, []);
      setSelectedRole(role);
    }
  }, [user]);
  
  // Hantera rollbyte
  const handleRoleChange = (role: UserRolePermission) => {
    setSelectedRole(role);
  };
  
  // Hantera anpassade behörigheter
  const handleCustomPermissionsChange = (permissions: UserPermission[]) => {
    setCustomPermissions(permissions);
  };
  
  // Hantera sparande av behörigheter
  const handleSavePermissions = async () => {
    if (!user || !selectedRole) return;
    
    try {
      await updatePermissions({
        userId: user.id.toString(),
        role: selectedRole.role,
        customPermissions: customPermissions.map(p => p.name)
      });
      
      // Navigera tillbaka efter framgångsrik uppdatering
      router.back();
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };
  
  return (
    <Container>
      <Stack.Screen options={{ 
        title: 'Hantera användarbehörigheter',
        headerBackTitle: 'Tillbaka'
      }} />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Laddar användardata...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Ett fel uppstod vid hämtning av användardata: {error.message}
          </Text>
        </View>
      ) : !user ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Användaren hittades inte.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              Behörigheter för {user.name || 'Användare'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Hantera användarroller och specifika behörigheter
            </Text>
          </View>
          
          <UserPermissionManager
            user={user}
            onRoleChange={handleRoleChange}
            onCustomPermissionsChange={handleCustomPermissionsChange}
            allowCustomPermissions={true}
          />
          
          {updateError && (
            <Text style={styles.errorText}>
              Ett fel uppstod: {updateError.message}
            </Text>
          )}
        </ScrollView>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 8,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
}); 