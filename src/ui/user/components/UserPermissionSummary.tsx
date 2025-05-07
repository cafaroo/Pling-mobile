import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { UserRolePermission } from '@/domain/user/value-objects/UserRolePermission';
import { UserPermission } from '@/domain/user/value-objects/UserPermission';
import { User } from '@/domain/user/entities/User';

interface UserPermissionSummaryProps {
  /**
   * Användaren vars behörigheter ska visas
   */
  user: User;
  
  /**
   * Användarens anpassade behörigheter utöver rollbehörigheter
   */
  customPermissions?: UserPermission[];
  
  /**
   * Maximal antal behörigheter att visa
   */
  maxPermissions?: number;
  
  /**
   * Om hanteringsknapp ska visas
   */
  showManageButton?: boolean;
  
  /**
   * Om klick på komponenten ska navigera till behörighetshantering
   */
  navigateOnPress?: boolean;
}

/**
 * Komponent för att visa sammanfattning av användarbehörigheter
 */
export const UserPermissionSummary: React.FC<UserPermissionSummaryProps> = ({
  user,
  customPermissions = [],
  maxPermissions = 5,
  showManageButton = true,
  navigateOnPress = false,
}) => {
  const theme = useTheme();
  const router = useRouter();
  
  // Hämta användarens rollbehörigheter
  const { roleInfo, effectivePermissions } = useMemo(() => {
    // Skapa rollobjekt
    const role = user.role 
      ? UserRolePermission.create(
          user.role.value, 
          customPermissions.map(p => p.name)
        )
      : UserRolePermission.getUserRole(); // Default till standardanvändare om ingen roll finns
    
    return {
      roleInfo: role.roleInfo,
      effectivePermissions: role.permissionObjects
    };
  }, [user, customPermissions]);
  
  // Navigera till behörighetshanteringsskärmen
  const handleManagePress = () => {
    router.push({
      pathname: '/permissions/manage',
      params: { userId: user.id.toString() }
    });
  };
  
  // Hantera klick på komponenten
  const handlePress = () => {
    if (navigateOnPress) {
      handleManagePress();
    }
  };
  
  // Dela upp behörigheter för visning
  const visiblePermissions = effectivePermissions.slice(0, maxPermissions);
  const hiddenCount = Math.max(0, effectivePermissions.length - maxPermissions);
  
  const CardComponent = navigateOnPress ? TouchableOpacity : View;
  
  return (
    <Card>
      <CardComponent onPress={handlePress} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Behörighetssammanfattning</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Roll</Text>
          <Chip 
            mode="outlined" 
            style={[styles.roleChip, { borderColor: theme.colors.primary }]}
          >
            {roleInfo.displayName}
          </Chip>
          
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            Effektiva behörigheter ({effectivePermissions.length})
          </Text>
          
          <View style={styles.permissionsContainer}>
            {visiblePermissions.map((permission) => (
              <Chip 
                key={permission.name}
                style={styles.permissionChip}
              >
                {permission.name}
              </Chip>
            ))}
            
            {hiddenCount > 0 && (
              <Chip style={styles.moreChip}>
                +{hiddenCount} fler
              </Chip>
            )}
          </View>
        </View>
        
        {showManageButton && (
          <Card.Actions style={styles.actions}>
            <Button 
              mode="outlined" 
              onPress={handleManagePress}
            >
              Hantera behörigheter
            </Button>
          </Card.Actions>
        )}
      </CardComponent>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  content: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  permissionChip: {
    margin: 4,
  },
  moreChip: {
    margin: 4,
    backgroundColor: '#f0f0f0',
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
}); 