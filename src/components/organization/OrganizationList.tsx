import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { Organization } from '@/domain/organization/entities/Organization';

interface OrganizationListProps {
  onSelectOrganization?: (organization: Organization) => void;
  onCreateNew?: () => void;
}

export const OrganizationList: React.FC<OrganizationListProps> = ({ 
  onSelectOrganization, 
  onCreateNew 
}) => {
  const { userOrganizations, loadingOrganizations, currentOrganization, setCurrentOrganization } = useOrganization();

  const handleSelectOrganization = (organization: Organization) => {
    setCurrentOrganization(organization);
    if (onSelectOrganization) {
      onSelectOrganization(organization);
    }
  };

  if (loadingOrganizations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar organisationer...</Text>
      </View>
    );
  }

  if (userOrganizations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Du har inga organisationer</Text>
        {onCreateNew && (
          <TouchableOpacity style={styles.createButton} onPress={onCreateNew}>
            <Text style={styles.createButtonText}>Skapa organisation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dina organisationer</Text>
      
      <FlatList
        data={userOrganizations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.organizationItem, 
              currentOrganization?.id.equals(item.id) && styles.selectedOrganization
            ]} 
            onPress={() => handleSelectOrganization(item)}
          >
            <View>
              <Text style={styles.organizationName}>{item.name}</Text>
              <Text style={styles.memberCount}>
                {item.members.length} {item.members.length === 1 ? 'medlem' : 'medlemmar'}
              </Text>
            </View>
            {currentOrganization?.id.equals(item.id) && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Aktiv</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {onCreateNew && (
        <TouchableOpacity style={styles.createButton} onPress={onCreateNew}>
          <Text style={styles.createButtonText}>Skapa ny organisation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  organizationItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOrganization: {
    backgroundColor: '#E6F2FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberCount: {
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  currentBadge: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  }
}); 