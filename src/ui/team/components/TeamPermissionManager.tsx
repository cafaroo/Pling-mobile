import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Divider, Switch, Searchbar, Chip, Banner, useTheme } from 'react-native-paper';
import { TeamPermission, PermissionCategory } from '@/domain/team/value-objects/TeamPermission';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { TeamRole } from '@/domain/team/value-objects/TeamRole';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';
import { TeamPermissionList } from './TeamPermissionList';
import { TeamRoleSelector } from './TeamRoleSelector';

interface TeamPermissionManagerProps {
  /**
   * Teamet vars behörigheter ska hanteras
   */
  team: Team;
  
  /**
   * Medlem som redigeras
   */
  member?: TeamMember;
  
  /**
   * Callback när roller ändras
   */
  onRoleChange?: (role: TeamRolePermission) => void;
  
  /**
   * Callback när individuella behörigheter ändras
   */
  onCustomPermissionsChange?: (permissions: TeamPermission[]) => void;
  
  /**
   * Om anpassade behörigheter är tillåtna utöver roller
   */
  allowCustomPermissions?: boolean;
  
  /**
   * Om bara visa läge (utan möjlighet att ändra)
   */
  readOnly?: boolean;
}

/**
 * Komponent för att hantera teambehörigheter
 */
export const TeamPermissionManager: React.FC<TeamPermissionManagerProps> = ({
  team,
  member,
  onRoleChange,
  onCustomPermissionsChange,
  allowCustomPermissions = true,
  readOnly = false,
}) => {
  const theme = useTheme();
  
  // State
  const [selectedRole, setSelectedRole] = useState<TeamRolePermission | undefined>(
    member ? TeamRolePermission.create(member.role, []) : undefined
  );
  const [customPermissions, setCustomPermissions] = useState<TeamPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  
  // Lista över alla behörigheter
  const allPermissions = useMemo(() => TeamPermission.createAll(), []);
  
  // Behörigheter från vald roll
  const rolePermissions = useMemo(() => {
    return selectedRole ? selectedRole.permissionObjects : [];
  }, [selectedRole]);
  
  // Alla effektiva behörigheter (roll + anpassade)
  const effectivePermissions = useMemo(() => {
    const permissions = [...rolePermissions];
    
    // Lägg till anpassade behörigheter som inte redan finns i rollbehörigheter
    customPermissions.forEach(permission => {
      if (!permissions.some(p => p.name === permission.name)) {
        permissions.push(permission);
      }
    });
    
    return permissions;
  }, [rolePermissions, customPermissions]);
  
  // Filtrerade behörigheter baserat på sökfråga
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) {
      return allPermissions;
    }
    
    const query = searchQuery.toLowerCase();
    return allPermissions.filter(permission => 
      permission.name.toLowerCase().includes(query) || 
      permission.description.toLowerCase().includes(query)
    );
  }, [allPermissions, searchQuery]);
  
  // Kontrollera om en behörighet är aktiv (från roll eller anpassad)
  const isPermissionActive = useCallback((permission: TeamPermission) => {
    return effectivePermissions.some(p => p.name === permission.name);
  }, [effectivePermissions]);
  
  // Hantera växling av behörighet
  const handleTogglePermission = useCallback((permission: TeamPermission) => {
    if (readOnly) return;
    
    // Kontrollera om behörigheten kommer från en roll
    const isFromRole = rolePermissions.some(p => p.name === permission.name);
    
    if (isFromRole) {
      // Kan inte inaktivera rollbehörigheter direkt
      return;
    }
    
    // Växla anpassad behörighet
    let updatedPermissions: TeamPermission[];
    
    if (customPermissions.some(p => p.name === permission.name)) {
      // Ta bort behörighet
      updatedPermissions = customPermissions.filter(p => p.name !== permission.name);
    } else {
      // Lägg till behörighet
      updatedPermissions = [...customPermissions, permission];
    }
    
    setCustomPermissions(updatedPermissions);
    onCustomPermissionsChange && onCustomPermissionsChange(updatedPermissions);
  }, [customPermissions, rolePermissions, readOnly, onCustomPermissionsChange]);
  
  // Hantera val av roll
  const handleRoleSelect = useCallback((role: TeamRolePermission) => {
    if (readOnly) return;
    
    setSelectedRole(role);
    onRoleChange && onRoleChange(role);
  }, [readOnly, onRoleChange]);
  
  return (
    <ScrollView style={styles.container}>
      <Banner
        visible={true}
        actions={[]}
        icon="shield-account"
      >
        Hantera behörigheter för {member ? `medlem: ${member.userId}` : `team: ${team.name}`}
        {readOnly && ' (Skrivskyddat)'}
      </Banner>
      
      <View style={styles.tabContainer}>
        <Button 
          mode={activeTab === 'roles' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('roles')}
          style={styles.tabButton}
        >
          Roller
        </Button>
        <Button 
          mode={activeTab === 'permissions' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('permissions')}
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
                <Button onPress={() => setShowAllPermissions(!showAllPermissions)}>
                  {showAllPermissions ? 'Dölj roller' : 'Välj roll'}
                </Button>
              </Card.Actions>
            )}
          </Card>
          
          {!readOnly && showAllPermissions && (
            <Card style={styles.card}>
              <Card.Content>
                <TeamRoleSelector
                  selectedRole={selectedRole}
                  onRoleChange={handleRoleSelect}
                  showPermissionDetails={false}
                />
              </Card.Content>
            </Card>
          )}
          
          <Text style={styles.sectionTitle}>Behörigheter från roll</Text>
          <Card style={styles.card}>
            <Card.Content>
              {rolePermissions.length > 0 ? (
                <TeamPermissionList 
                  permissions={rolePermissions}
                  groupByCategory={true}
                />
              ) : (
                <Text style={styles.noRolesText}>Inga rollbehörigheter</Text>
              )}
            </Card.Content>
          </Card>
        </View>
      )}
      
      {activeTab === 'permissions' && (
        <View style={styles.section}>
          {allowCustomPermissions && (
            <>
              <Text style={styles.sectionTitle}>Anpassade behörigheter</Text>
              <Card style={styles.card}>
                <Card.Content>
                  <Searchbar
                    placeholder="Sök behörigheter"
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                  />
                  
                  <Divider style={styles.divider} />
                  
                  <ScrollView style={styles.permissionListContainer}>
                    <TeamPermissionList 
                      permissions={filteredPermissions}
                      groupByCategory={true}
                      onPermissionPress={readOnly ? undefined : handleTogglePermission}
                      showDescriptions={true}
                    />
                  </ScrollView>
                </Card.Content>
              </Card>
            </>
          )}
          
          <Text style={styles.sectionTitle}>Effektiva behörigheter</Text>
          <Card style={styles.card}>
            <Card.Content>
              {effectivePermissions.length > 0 ? (
                <TeamPermissionList 
                  permissions={effectivePermissions}
                  groupByCategory={true}
                  showDescriptions={false}
                />
              ) : (
                <Text style={styles.noRolesText}>Inga effektiva behörigheter</Text>
              )}
            </Card.Content>
          </Card>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  roleChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleChip: {
    margin: 4,
  },
  noRolesText: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  divider: {
    marginBottom: 16,
  },
  permissionListContainer: {
    maxHeight: 300,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  tabButton: {
    marginHorizontal: 8,
  },
}); 