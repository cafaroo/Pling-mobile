import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { List, Chip, useTheme, Divider } from 'react-native-paper';
import { UserPermission, PermissionCategory } from '@/domain/user/value-objects/UserPermission';

interface UserPermissionListProps {
  /**
   * Lista av behörigheter att visa
   */
  permissions: UserPermission[];
  
  /**
   * Om behörigheter ska grupperas efter kategori
   */
  groupByCategory?: boolean;
  
  /**
   * Callback när en behörighet trycks på
   */
  onPermissionPress?: (permission: UserPermission) => void;
  
  /**
   * Om komponenten ska visa detaljerade beskrivningar
   */
  showDescriptions?: boolean;
}

/**
 * Komponent som visar en lista över användarbehörigheter
 */
export const UserPermissionList: React.FC<UserPermissionListProps> = ({
  permissions,
  groupByCategory = true,
  onPermissionPress,
  showDescriptions = true,
}) => {
  const theme = useTheme();
  
  // Gruppera behörigheter efter kategori
  const getGroupedPermissions = () => {
    if (!groupByCategory) {
      return { 'Alla behörigheter': permissions };
    }
    
    const grouped: Record<string, UserPermission[]> = {};
    
    permissions.forEach(permission => {
      const category = permission.category;
      const categoryName = getCategoryDisplayName(category);
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      
      grouped[categoryName].push(permission);
    });
    
    return grouped;
  };
  
  // Konvertera kategorienums till visningsnamn
  const getCategoryDisplayName = (category: PermissionCategory): string => {
    const displayNames: Record<PermissionCategory, string> = {
      [PermissionCategory.USER]: 'Användare',
      [PermissionCategory.TEAM]: 'Team',
      [PermissionCategory.CONTENT]: 'Innehåll',
      [PermissionCategory.SETTINGS]: 'Inställningar',
      [PermissionCategory.ANALYTICS]: 'Analys',
      [PermissionCategory.PROFILE]: 'Profil',
      [PermissionCategory.COMPETITION]: 'Tävling',
      [PermissionCategory.GOAL]: 'Mål',
      [PermissionCategory.MESSAGING]: 'Meddelanden',
      [PermissionCategory.ACTIVITY]: 'Aktivitet',
      [PermissionCategory.ADMIN]: 'Administration'
    };
    
    return displayNames[category] || 'Övrigt';
  };
  
  // Få färg för kategori
  const getCategoryColor = (category: PermissionCategory): string => {
    const categoryColors: Record<PermissionCategory, string> = {
      [PermissionCategory.USER]: theme.colors.primary,
      [PermissionCategory.TEAM]: '#8e44ad',
      [PermissionCategory.CONTENT]: '#2980b9',
      [PermissionCategory.SETTINGS]: '#16a085',
      [PermissionCategory.ANALYTICS]: '#27ae60',
      [PermissionCategory.PROFILE]: '#d35400',
      [PermissionCategory.COMPETITION]: '#c0392b',
      [PermissionCategory.GOAL]: '#f39c12',
      [PermissionCategory.MESSAGING]: '#3498db',
      [PermissionCategory.ACTIVITY]: '#1abc9c',
      [PermissionCategory.ADMIN]: '#7f8c8d'
    };
    
    return categoryColors[category] || theme.colors.primary;
  };
  
  const groupedPermissions = getGroupedPermissions();
  
  return (
    <ScrollView style={styles.container}>
      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <View key={category} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <Divider style={styles.divider} />
          
          <View style={styles.permissionsContainer}>
            {perms.map((permission) => (
              <List.Item
                key={permission.name}
                title={<Text style={styles.permissionName}>{permission.toString()}</Text>}
                description={showDescriptions ? permission.description : undefined}
                onPress={() => onPermissionPress && onPermissionPress(permission)}
                left={() => (
                  <Chip
                    style={[
                      styles.categoryChip,
                      { backgroundColor: getCategoryColor(permission.category) }
                    ]}
                    textStyle={styles.categoryChipText}
                  >
                    {getCategoryDisplayName(permission.category).substring(0, 3)}
                  </Chip>
                )}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
  },
  divider: {
    marginVertical: 8,
  },
  permissionsContainer: {
    marginHorizontal: 8,
  },
  permissionName: {
    fontWeight: '500',
  },
  categoryChip: {
    marginVertical: 8,
    height: 32,
    justifyContent: 'center',
  },
  categoryChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 