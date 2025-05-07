import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { List, RadioButton, Divider, Chip, Card, Button, useTheme } from 'react-native-paper';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { TeamPermissionList } from './TeamPermissionList';

interface TeamRoleSelectorProps {
  /**
   * Den valda rollen
   */
  selectedRole?: TeamRolePermission;
  
  /**
   * Callback när rollen ändras
   */
  onRoleChange?: (role: TeamRolePermission) => void;
  
  /**
   * Lista av tillgängliga roller att visa
   * Om inte angiven, visas alla standardroller
   */
  availableRoles?: TeamRolePermission[];
  
  /**
   * Om detaljerad information om behörigheter ska visas
   */
  showPermissionDetails?: boolean;
}

/**
 * Komponent för att välja teamroller
 */
export const TeamRoleSelector: React.FC<TeamRoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  availableRoles,
  showPermissionDetails = false,
}) => {
  const theme = useTheme();
  const [expandedRole, setExpandedRole] = useState<string | null>(
    selectedRole ? selectedRole.role : null
  );
  
  // Använd antingen tillhandahållna roller eller hämta alla standardroller
  const roles = availableRoles || TeamRolePermission.getRolesByPriority();
  
  // Hantera val av roll
  const handleRoleSelect = (role: TeamRolePermission) => {
    onRoleChange && onRoleChange(role);
  };
  
  // Växla expandering för en roll
  const toggleExpanded = (roleName: string) => {
    setExpandedRole(expandedRole === roleName ? null : roleName);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Välj teamroll</Text>
      
      {roles.map((role) => {
        const isExpanded = expandedRole === role.role;
        const isSelected = selectedRole && selectedRole.role === role.role;
        
        return (
          <Card 
            key={role.role} 
            style={[
              styles.roleCard, 
              isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
            ]}
            mode="outlined"
          >
            <List.Item
              title={<Text style={styles.roleName}>{role.displayName}</Text>}
              description={role.description}
              left={() => (
                <RadioButton
                  value={role.role}
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => handleRoleSelect(role)}
                />
              )}
              right={() => (
                <Button 
                  mode="text" 
                  onPress={() => toggleExpanded(role.role)}
                >
                  {isExpanded ? 'Dölj' : 'Visa'}
                </Button>
              )}
              onPress={() => handleRoleSelect(role)}
            />
            
            {isExpanded && (
              <View style={styles.expandedContent}>
                <Divider />
                
                <View style={styles.roleInfoContainer}>
                  <Text style={styles.sectionTitle}>
                    Behörigheter ({role.permissionObjects.length})
                  </Text>
                  
                  {showPermissionDetails ? (
                    <TeamPermissionList 
                      permissions={role.permissionObjects}
                      showDescriptions={true}
                    />
                  ) : (
                    <View style={styles.permissionChipsContainer}>
                      {role.permissionObjects.map(permission => (
                        <Chip 
                          key={permission.name}
                          style={styles.permissionChip}
                          mode="outlined"
                        >
                          {permission.toString()}
                        </Chip>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </Card>
        );
      })}
      
      {selectedRole && (
        <View style={styles.selectedRoleContainer}>
          <Text style={styles.selectedRoleText}>
            Vald roll: <Text style={styles.boldText}>{selectedRole.displayName}</Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  roleCard: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  roleName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
  },
  roleInfoContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  permissionChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionChip: {
    margin: 4,
  },
  selectedRoleContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedRoleText: {
    fontSize: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
}); 