import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Divider, Switch, Searchbar, Chip, Banner, useTheme } from 'react-native-paper';
import { UserPermission, PermissionCategory } from '@/domain/user/value-objects/UserPermission';
import { UserRole, RoleName } from '@/domain/user/value-objects/UserRole';
import { User } from '@/domain/user/entities/User';
import { PermissionList } from './PermissionList';
import { RoleSelector } from './RoleSelector';

interface PermissionManagerProps {
  /**
   * Användaren vars behörigheter ska hanteras
   */
  user: User;
  
  /**
   * Callback när roller ändras
   */
  onRolesChange?: (roles: UserRole[]) => void;
  
  /**
   * Callback när individuella behörigheter ändras
   */
  onCustomPermissionsChange?: (permissions: UserPermission[]) => void;
  
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
 * Komponent för att hantera användarbehörigheter
 */
export const PermissionManager: React.FC<PermissionManagerProps> = ({
  user,
  onRolesChange,
  onCustomPermissionsChange,
  allowCustomPermissions = true,
  readOnly = false,
}) => {
  const theme = useTheme();
  
  // State
  const [userRoles, setUserRoles] = useState<UserRole[]>(user.roles || []);
  const [customPermissions, setCustomPermissions] = useState<UserPermission[]>(user.customPermissions || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  
  // Lista över alla behörigheter
  const allPermissions = useMemo(() => UserPermission.createAll(), []);
  
  // Behörigheter från roller
  const rolePermissions = useMemo(() => {
    const permissions: UserPermission[] = [];
    userRoles.forEach(role => {
      role.permissionObjects.forEach(permission => {
        if (!permissions.some(p => p.equals(permission))) {
          permissions.push(permission);
        }
      });
    });
    return permissions;
  }, [userRoles]);
  
  // Alla effektiva behörigheter (roller + anpassade)
  const effectivePermissions = useMemo(() => {
    const permissions = [...rolePermissions];
    
    // Lägg till anpassade behörigheter som inte redan finns i rollbehörigheter
    customPermissions.forEach(permission => {
      if (!permissions.some(p => p.equals(permission))) {
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
  
  // Kontrollera om en behörighet är aktiv (från roller eller anpassad)
  const isPermissionActive = useCallback((permission: UserPermission) => {
    return effectivePermissions.some(p => p.equals(permission));
  }, [effectivePermissions]);
  
  // Hantera växling av behörighet
  const handleTogglePermission = useCallback((permission: UserPermission) => {
    if (readOnly) return;
    
    // Kontrollera om behörigheten kommer från en roll
    const isFromRole = rolePermissions.some(p => p.equals(permission));
    
    if (isFromRole) {
      // Kan inte inaktivera rollbehörigheter direkt
      return;
    }
    
    // Växla anpassad behörighet
    let updatedPermissions: UserPermission[];
    
    if (customPermissions.some(p => p.equals(permission))) {
      // Ta bort behörighet
      updatedPermissions = customPermissions.filter(p => !p.equals(permission));
    } else {
      // Lägg till behörighet
      updatedPermissions = [...customPermissions, permission];
    }
    
    setCustomPermissions(updatedPermissions);
    onCustomPermissionsChange && onCustomPermissionsChange(updatedPermissions);
  }, [customPermissions, rolePermissions, readOnly, onCustomPermissionsChange]);
  
  // Hantera tillägg av roll
  const handleAddRole = useCallback((role: UserRole) => {
    if (readOnly) return;
    
    // Kontrollera om rollen redan finns
    if (userRoles.some(r => r.equals(role))) {
      return;
    }
    
    const updatedRoles = [...userRoles, role];
    setUserRoles(updatedRoles);
    onRolesChange && onRolesChange(updatedRoles);
  }, [userRoles, readOnly, onRolesChange]);
  
  // Hantera borttagning av roll
  const handleRemoveRole = useCallback((role: UserRole) => {
    if (readOnly) return;
    
    const updatedRoles = userRoles.filter(r => !r.equals(role));
    setUserRoles(updatedRoles);
    onRolesChange && onRolesChange(updatedRoles);
  }, [userRoles, readOnly, onRolesChange]);
  
  return (
    <ScrollView style={styles.container}>
      <Banner
        visible={true}
        actions={[]}
        icon="shield-account"
      >
        Hantera behörigheter för {user.profile.displayName || 'användare'}
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
          <Text style={styles.sectionTitle}>Användarroller</Text>
          <Card style={styles.card}>
            <Card.Content>
              {userRoles.length > 0 ? (
                <View style={styles.roleChipContainer}>
                  {userRoles.map(role => (
                    <Chip
                      key={role.name}
                      style={[styles.roleChip, { backgroundColor: theme.colors.primary }]}
                      textStyle={{ color: 'white' }}
                      onClose={readOnly ? undefined : () => handleRemoveRole(role)}
                    >
                      {role.displayName}
                    </Chip>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRolesText}>Inga roller tilldelade</Text>
              )}
            </Card.Content>
            
            {!readOnly && (
              <Card.Actions>
                <Button onPress={() => setShowAllPermissions(!showAllPermissions)}>
                  {showAllPermissions ? 'Dölj alla roller' : 'Lägg till roll'}
                </Button>
              </Card.Actions>
            )}
          </Card>
          
          {!readOnly && showAllPermissions && (
            <Card style={styles.card}>
              <Card.Content>
                <RoleSelector
                  onRoleChange={handleAddRole}
                  availableRoles={UserRole.getAllRoles().filter(
                    role => !userRoles.some(r => r.equals(role))
                  )}
                  showPermissionDetails={false}
                />
              </Card.Content>
            </Card>
          )}
          
          <Text style={styles.sectionTitle}>Behörigheter från roller</Text>
          <Card style={styles.card}>
            <Card.Content>
              {rolePermissions.length > 0 ? (
                <PermissionList 
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
                    <PermissionList 
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
                <PermissionList 
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