import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, Button, useTheme } from 'react-native-paper';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { useRouter } from 'expo-router';

interface TeamMemberPermissionSummaryProps {
  /**
   * Teammedlemmen vars behörigheter ska visas
   */
  member: TeamMember;
  
  /**
   * Team-ID som medlemmen tillhör
   */
  teamId: string;
  
  /**
   * Medlemmens anpassade behörigheter
   */
  customPermissions?: TeamPermission[];
  
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
 * Komponent för att visa sammanfattning av teammedlems behörigheter
 */
export const TeamMemberPermissionSummary: React.FC<TeamMemberPermissionSummaryProps> = ({
  member,
  teamId,
  customPermissions = [],
  maxPermissions = 5,
  showManageButton = true,
  navigateOnPress = false,
}) => {
  const theme = useTheme();
  const router = useRouter();
  
  // Hämta medlemmens rollbehörigheter
  const { roleInfo, effectivePermissions } = useMemo(() => {
    // Skapa rollobjekt
    const role = TeamRolePermission.create(
      member.role, 
      customPermissions.map(p => p.name)
    );
    
    // Samla effektiva behörigheter
    const perms = [...role.permissionObjects];
    
    // Lägg till anpassade behörigheter som inte redan finns i rollbehörigheter
    customPermissions.forEach(permission => {
      if (!perms.some(p => p.name === permission.name)) {
        perms.push(permission);
      }
    });
    
    return {
      roleInfo: role,
      effectivePermissions: perms
    };
  }, [member, customPermissions]);
  
  // Navigera till behörighetshanteringsskärmen
  const handleManagePress = () => {
    router.push({
      pathname: 'team/member-role',
      params: { 
        teamId: teamId,
        userId: member.userId.toString() 
      }
    });
  };
  
  // Beräkna om det finns fler behörigheter än vad som visas
  const hasMorePermissions = effectivePermissions.length > maxPermissions;
  const visiblePermissions = hasMorePermissions 
    ? effectivePermissions.slice(0, maxPermissions) 
    : effectivePermissions;
  const remainingPermissionsCount = hasMorePermissions 
    ? effectivePermissions.length - maxPermissions 
    : 0;
  
  const CardComponent = navigateOnPress ? TouchableOpacity : View;
  
  return (
    <CardComponent 
      style={styles.container}
      onPress={navigateOnPress ? handleManagePress : undefined}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Medlemsbehörigheter</Text>
            {showManageButton && (
              <Button 
                mode="text" 
                onPress={handleManagePress}
                compact
              >
                Hantera
              </Button>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roll</Text>
            <View style={styles.chipContainer}>
              <Chip 
                style={[styles.roleChip, { backgroundColor: theme.colors.primary }]}
                textStyle={{ color: 'white' }}
              >
                {roleInfo.displayName}
              </Chip>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Behörigheter ({effectivePermissions.length})</Text>
            {effectivePermissions.length > 0 ? (
              <View style={styles.chipContainer}>
                {visiblePermissions.map(permission => (
                  <Chip 
                    key={permission.name}
                    style={styles.permissionChip}
                    mode="outlined"
                  >
                    {permission.toString()}
                  </Chip>
                ))}
                
                {hasMorePermissions && (
                  <Chip 
                    style={styles.moreChip}
                    onPress={handleManagePress}
                  >
                    +{remainingPermissionsCount} fler
                  </Chip>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>Inga behörigheter</Text>
            )}
          </View>
          
          {customPermissions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Anpassade behörigheter ({customPermissions.length})</Text>
              <View style={styles.chipContainer}>
                {customPermissions.map(permission => (
                  <Chip 
                    key={permission.name}
                    style={[styles.customChip, { borderColor: theme.colors.secondary }]}
                    mode="outlined"
                  >
                    {permission.toString()}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleChip: {
    margin: 4,
  },
  permissionChip: {
    margin: 4,
  },
  customChip: {
    margin: 4,
    borderWidth: 2,
  },
  moreChip: {
    margin: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  emptyText: {
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 