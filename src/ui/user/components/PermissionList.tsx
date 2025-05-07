import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { List, Chip, useTheme, Divider } from 'react-native-paper';
import { UserPermission, PermissionCategory } from '@/domain/user/value-objects/UserPermission';

interface PermissionListProps {
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
 * Komponent som visar en lista över behörigheter
 */
export const PermissionList: React.FC<PermissionListProps> = ({
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
      [PermissionCategory.COMPETITION]: 'Tävlingar',
      [PermissionCategory.GOAL]: 'Mål',
      [PermissionCategory.MESSAGING]: 'Meddelanden',
      [PermissionCategory.ACTIVITY]: 'Aktivitet',
      [PermissionCategory.ADMIN]: 'Administration'
    };
    
    return displayNames[category] || 'Övrigt';
  };
  
  // Få färg baserat på kategori för visuell gruppdistinktion
  const getCategoryColor = (category: PermissionCategory): string => {
    const colors: Record<PermissionCategory, string> = {
      [PermissionCategory.USER]: theme.colors.primary,
      [PermissionCategory.TEAM]: theme.colors.secondary,
      [PermissionCategory.CONTENT]: '#4CAF50',
      [PermissionCategory.SETTINGS]: '#9C27B0',
      [PermissionCategory.ANALYTICS]: '#2196F3',
      [PermissionCategory.PROFILE]: '#FF9800',
      [PermissionCategory.COMPETITION]: '#F44336',
      [PermissionCategory.GOAL]: '#00BCD4',
      [PermissionCategory.MESSAGING]: '#607D8B',
      [PermissionCategory.ACTIVITY]: '#795548',
      [PermissionCategory.ADMIN]: '#E91E63'
    };
    
    return colors[category] || theme.colors.primary;
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