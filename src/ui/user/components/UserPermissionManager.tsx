import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Divider, Switch, Searchbar, Chip, Banner, useTheme } from 'react-native-paper';
import { UserPermission, PermissionCategory } from '@/domain/user/value-objects/UserPermission';
import { UserRolePermission } from '@/domain/user/value-objects/UserRolePermission';
import { User } from '@/domain/user/entities/User';
import { UserPermissionList } from './UserPermissionList';
import { UserRoleSelector } from './UserRoleSelector';

interface UserPermissionManagerProps {
  /**
   * Användaren vars behörigheter ska hanteras
   */
  user?: User;
  
  /**
   * Callback när roller ändras
   */
  onRoleChange?: (role: UserRolePermission) => void;
  
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
export const UserPermissionManager: React.FC<UserPermissionManagerProps> = ({
  user,
  onRoleChange,
  onCustomPermissionsChange,
  allowCustomPermissions = true,
  readOnly = false,
}) => {
  const theme = useTheme();
  
  // State
  const [selectedRole, setSelectedRole] = useState<UserRolePermission | undefined>(
    user?.role ? UserRolePermission.create(user.role.value, []) : undefined
  );
  const [customPermissions, setCustomPermissions] = useState<UserPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  
  // Lista över alla behörigheter
  const allPermissions = useMemo(() => UserPermission.createAll(), []);
  
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
  const isPermissionActive = useCallback((permission: UserPermission) => {
    return effectivePermissions.some(p => p.name === permission.name);
  }, [effectivePermissions]);
  
  // Hantera växling av behörighet
  const handleTogglePermission = useCallback((permission: UserPermission) => {
    if (readOnly) return;
    
    // Kontrollera om behörigheten kommer från en roll
    const isFromRole = rolePermissions.some(p => p.name === permission.name);
    
    if (isFromRole) {
      // Kan inte inaktivera rollbehörigheter direkt
      return;
    }
    
    // Växla anpassad behörighet
    let updatedPermissions: UserPermission[];
    
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
  const handleRoleSelect = useCallback((role: UserRolePermission) => {
    if (readOnly) return;
    
    setSelectedRole(role);
    onRoleChange && onRoleChange(role);
  }, [readOnly, onRoleChange]);
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabContainer}>
        <Button 
          mode={activeTab === 'roles' ? 'contained' : 'outlined'}
          style={styles.tabButton}
          onPress={() => setActiveTab('roles')}
        >
          Roller
        </Button>
        <Button 
          mode={activeTab === 'permissions' ? 'contained' : 'outlined'}
          style={styles.tabButton}
          onPress={() => setActiveTab('permissions')}
          disabled={!allowCustomPermissions}
        >
          Specifika behörigheter
        </Button>
      </View>
      
      {activeTab === 'roles' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Användarroll</Text>
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
                <UserRoleSelector
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
                <UserPermissionList 
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
      
      {activeTab === 'permissions' && allowCustomPermissions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anpassade behörigheter</Text>
          
          <Card style={styles.card}>
            <Card.Content>
              <Text>
                Anpassade behörigheter ger extra rättigheter utöver de behörigheter som kommer från användarens roll.
              </Text>
              
              <Searchbar
                placeholder="Sök behörigheter..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />
              
              <Divider style={styles.divider} />
              
              <View style={styles.permissionListContainer}>
                {filteredPermissions.map(permission => {
                  const isActive = isPermissionActive(permission);
                  const isFromRole = rolePermissions.some(p => p.name === permission.name);
                  
                  return (
                    <List.Item
                      key={permission.name}
                      title={permission.toString()}
                      description={permission.description}
                      left={() => (
                        <Chip
                          style={[
                            styles.categoryChip,
                            { backgroundColor: theme.colors.primary }
                          ]}
                          textStyle={{ color: 'white' }}
                        >
                          {permission.category.substring(0, 3).toUpperCase()}
                        </Chip>
                      )}
                      right={() => (
                        <Switch
                          value={isActive}
                          onValueChange={() => handleTogglePermission(permission)}
                          disabled={readOnly || isFromRole}
                        />
                      )}
                    />
                  );
                })}
              </View>
            </Card.Content>
          </Card>
          
          <Text style={styles.sectionTitle}>Alla aktiva behörigheter</Text>
          <Card style={styles.card}>
            <Card.Content>
              {effectivePermissions.length > 0 ? (
                <UserPermissionList 
                  permissions={effectivePermissions}
                  groupByCategory={true}
                />
              ) : (
                <Text style={styles.noRolesText}>Inga aktiva behörigheter</Text>
              )}
            </Card.Content>
          </Card>
        </View>
      )}
      
      {selectedRole && (
        <Banner
          visible={true}
          actions={[]}
          style={styles.banner}
        >
          <Text>
            Användaren har rollen <Text style={styles.boldText}>{selectedRole.displayName}</Text> 
            {customPermissions.length > 0 && 
              ` med ${customPermissions.length} anpassade behörigheter`}
          </Text>
        </Banner>
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
  banner: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  boldText: {
    fontWeight: 'bold',
  },
  categoryChip: {
    marginVertical: 8,
    height: 32,
    justifyContent: 'center',
  },
}); 