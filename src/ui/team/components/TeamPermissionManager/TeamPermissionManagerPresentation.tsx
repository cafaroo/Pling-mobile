import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Divider, Switch, Searchbar, Chip, Banner, useTheme } from 'react-native-paper';
import { TeamPermissionList } from '../TeamPermissionList';
import { TeamRoleSelector } from '../TeamRoleSelector';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';

interface TeamPermissionManagerPresentationProps {
  // Visning
  teamName: string;
  memberUserId?: string;
  readOnly: boolean;
  selectedRole?: TeamRolePermission;
  customPermissions: TeamPermission[];
  allPermissions: TeamPermission[];
  rolePermissions: TeamPermission[];
  effectivePermissions: TeamPermission[];
  filteredPermissions: TeamPermission[];
  searchQuery: string;
  showAllPermissions: boolean;
  activeTab: 'roles' | 'permissions';
  
  // Händelser
  onTabChange: (tab: 'roles' | 'permissions') => void;
  onSearchChange: (query: string) => void;
  onTogglePermission: (permission: TeamPermission) => void;
  onRoleSelect: (role: TeamRolePermission) => void;
  onToggleShowAllPermissions: () => void;
  isPermissionActive: (permission: TeamPermission) => boolean;
}

/**
 * Presentationskomponent för TeamPermissionManager utan affärslogik
 */
export const TeamPermissionManagerPresentation: React.FC<TeamPermissionManagerPresentationProps> = ({
  teamName,
  memberUserId,
  readOnly,
  selectedRole,
  customPermissions,
  allPermissions,
  rolePermissions,
  effectivePermissions,
  filteredPermissions,
  searchQuery,
  showAllPermissions,
  activeTab,
  onTabChange,
  onSearchChange,
  onTogglePermission,
  onRoleSelect,
  onToggleShowAllPermissions,
  isPermissionActive,
}) => {
  const theme = useTheme();
  
  return (
    <ScrollView style={styles.container}>
      <Banner
        visible={true}
        actions={[]}
        icon="shield-account"
      >
        Hantera behörigheter för {memberUserId ? `medlem: ${memberUserId}` : `team: ${teamName}`}
        {readOnly && ' (Skrivskyddat)'}
      </Banner>
      
      <View style={styles.tabContainer}>
        <Button 
          mode={activeTab === 'roles' ? 'contained' : 'outlined'}
          onPress={() => onTabChange('roles')}
          style={styles.tabButton}
        >
          Roller
        </Button>
        <Button 
          mode={activeTab === 'permissions' ? 'contained' : 'outlined'}
          onPress={() => onTabChange('permissions')}
          style={styles.tabButton}
        >
          Behörigheter
        </Button>
      </View>
      
      {activeTab === 'roles' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teamroll</Text>
          <Card style={styles.card}>
            <Card.Content>
              {selectedRole ? (
                <View style={styles.roleChipContainer}>
                  <Chip
                    style={[styles.roleChip, { backgroundColor: theme.colors.primary }]}
                    textStyle={{ color: 'white' }}
                  >
                    {selectedRole.displayName}
                  </Chip>
                </View>
              ) : (
                <Text style={styles.noRolesText}>Ingen roll tilldelad</Text>
              )}
            </Card.Content>
            
            {!readOnly && (
              <Card.Actions>
                <Button onPress={onToggleShowAllPermissions}>
                  {showAllPermissions ? 'Dölj roller' : 'Välj roll'}
                </Button>
              </Card.Actions>
            )}
          </Card>
          
          {!readOnly && showAllPermissions && (
            <Card style={styles.card}>
              <Card.Content>
                <TeamRoleSelector
                  onRoleSelect={onRoleSelect}
                  selectedRole={selectedRole}
                />
              </Card.Content>
            </Card>
          )}
          
          <Text style={styles.sectionTitle}>Behörigheter från roll</Text>
          <TeamPermissionList 
            permissions={rolePermissions}
            readOnly={true} 
            title="Rollbehörigheter"
            isPermissionActive={() => true} // Alla rollbehörigheter är alltid aktiva
          />
        </View>
      )}
      
      {activeTab === 'permissions' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anpassade behörigheter</Text>
          
          <Searchbar
            placeholder="Sök behörigheter..."
            onChangeText={onSearchChange}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <TeamPermissionList 
            permissions={filteredPermissions}
            readOnly={readOnly}
            title="Tillgängliga behörigheter"
            onTogglePermission={onTogglePermission}
            isPermissionActive={isPermissionActive}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
    marginLeft: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  roleChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleChip: {
    margin: 4,
  },
  searchbar: {
    marginBottom: 12,
  },
  noRolesText: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
  },
}); 