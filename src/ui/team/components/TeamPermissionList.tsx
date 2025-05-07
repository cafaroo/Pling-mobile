import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { List, Chip, useTheme, Divider } from 'react-native-paper';
import { TeamPermission, PermissionCategory } from '@/domain/team/value-objects/TeamPermission';

interface TeamPermissionListProps {
  /**
   * Lista av behörigheter att visa
   */
  permissions: TeamPermission[];
  
  /**
   * Om behörigheter ska grupperas efter kategori
   */
  groupByCategory?: boolean;
  
  /**
   * Callback när en behörighet trycks på
   */
  onPermissionPress?: (permission: TeamPermission) => void;
  
  /**
   * Om komponenten ska visa detaljerade beskrivningar
   */
  showDescriptions?: boolean;
}

/**
 * Komponent som visar en lista över teambehörigheter
 */
export const TeamPermissionList: React.FC<TeamPermissionListProps> = ({
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
    
    const grouped: Record<string, TeamPermission[]> = {};
    
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
      [PermissionCategory.TEAM_MANAGEMENT]: 'Teamhantering',
      [PermissionCategory.MEMBER_MANAGEMENT]: 'Medlemshantering',
      [PermissionCategory.CONTENT_MANAGEMENT]: 'Innehållshantering',
      [PermissionCategory.STATISTICS]: 'Statistik',
      [PermissionCategory.COMMUNICATION]: 'Kommunikation',
      [PermissionCategory.GOALS]: 'Mål',
      [PermissionCategory.ADMIN]: 'Administration'
    };
    
    return displayNames[category] || 'Övrigt';
  };
  
  // Få färg baserat på kategori för visuell gruppdistinktion
  const getCategoryColor = (category: PermissionCategory): string => {
    const colors: Record<PermissionCategory, string> = {
      [PermissionCategory.TEAM_MANAGEMENT]: theme.colors.primary,
      [PermissionCategory.MEMBER_MANAGEMENT]: '#4CAF50', // Grön
      [PermissionCategory.CONTENT_MANAGEMENT]: '#2196F3', // Blå
      [PermissionCategory.STATISTICS]: '#9C27B0', // Lila
      [PermissionCategory.COMMUNICATION]: '#FF9800', // Orange
      [PermissionCategory.GOALS]: '#00BCD4', // Cyan
      [PermissionCategory.ADMIN]: '#F44336', // Röd
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