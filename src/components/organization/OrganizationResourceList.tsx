import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrganization } from './OrganizationProvider';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { ResourceType, ResourceTypeLabels } from '@/domain/organization/value-objects/ResourceType';
import { theme } from '@/styles/theme';

interface OrganizationResourceListProps {
  organizationId: string;
  resourceType?: ResourceType;
  onSelectResource: (resource: OrganizationResource) => void;
  onCreateResource: () => void;
  refreshTrigger?: number; // Trigger för att uppdatera listan utifrån
}

export const OrganizationResourceList: React.FC<OrganizationResourceListProps> = ({
  organizationId,
  resourceType,
  onSelectResource,
  onCreateResource,
  refreshTrigger = 0
}) => {
  const { getResourcesByOrganizationId, getResourcesByType } = useOrganization();
  
  const [resources, setResources] = useState<OrganizationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResourceType | null>(resourceType || null);

  // Hämta resurser
  const fetchResources = useCallback(async () => {
    try {
      setError(null);
      
      let fetchedResources: OrganizationResource[];
      
      if (selectedType) {
        fetchedResources = await getResourcesByType(organizationId, selectedType);
      } else {
        fetchedResources = await getResourcesByOrganizationId(organizationId);
      }
      
      setResources(fetchedResources);
    } catch (err) {
      setError('Kunde inte hämta resurser. Försök igen senare.');
      console.error('Fel vid hämtning av resurser:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [organizationId, selectedType, getResourcesByOrganizationId, getResourcesByType]);

  // Läs in resurser vid första renderingen och när någon beroende ändras
  useEffect(() => {
    setLoading(true);
    fetchResources();
  }, [fetchResources, refreshTrigger]);

  // Hantera refresh (pull-to-refresh)
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResources();
  }, [fetchResources]);

  // Filtrera resurser baserat på sökfråga
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) {
      return resources;
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    return resources.filter(resource => 
      resource.name.toLowerCase().includes(normalizedQuery) || 
      (resource.description && resource.description.toLowerCase().includes(normalizedQuery))
    );
  }, [resources, searchQuery]);

  // Hantera val av typ-filter
  const handleTypeFilter = (type: ResourceType | null) => {
    setSelectedType(type);
    setLoading(true);
  };

  // Filter-knappar för resurstyper
  const renderTypeFilters = () => {
    const allResourceTypes = Object.values(ResourceType);
    
    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              selectedType === null && styles.filterButtonActive
            ]}
            onPress={() => handleTypeFilter(null)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedType === null && styles.filterButtonTextActive
            ]}>
              Alla
            </Text>
          </TouchableOpacity>
          
          {allResourceTypes.map(type => (
            <TouchableOpacity 
              key={type}
              style={[
                styles.filterButton, 
                selectedType === type && styles.filterButtonActive
              ]}
              onPress={() => handleTypeFilter(type)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedType === type && styles.filterButtonTextActive
              ]}>
                {ResourceTypeLabels[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Renderera ett resursobjekt i listan
  const renderResourceItem = ({ item }: { item: OrganizationResource }) => (
    <TouchableOpacity 
      style={styles.resourceItem}
      onPress={() => onSelectResource(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resourceIconContainer}>
        {getResourceIcon(item.type)}
      </View>
      <View style={styles.resourceContent}>
        <Text style={styles.resourceName} numberOfLines={1}>{item.name}</Text>
        {item.description && (
          <Text style={styles.resourceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.resourceMeta}>
          <Text style={styles.resourceType}>{ResourceTypeLabels[item.type]}</Text>
          <Text style={styles.resourceDate}>
            {new Date(item.updatedAt).toLocaleDateString('sv-SE')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.colors.gray[400]} />
    </TouchableOpacity>
  );

  // Funktion för att hämta ikon baserat på resurstyp
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case ResourceType.DOCUMENT:
        return <Ionicons name="document-text" size={24} color={theme.colors.blue[500]} />;
      case ResourceType.PROJECT:
        return <Ionicons name="briefcase" size={24} color={theme.colors.green[500]} />;
      case ResourceType.GOAL:
        return <Ionicons name="flag" size={24} color={theme.colors.orange[500]} />;
      case ResourceType.MEETING:
        return <Ionicons name="people" size={24} color={theme.colors.purple[500]} />;
      case ResourceType.CALENDAR:
        return <Ionicons name="calendar" size={24} color={theme.colors.indigo[500]} />;
      default:
        return <Ionicons name="cube" size={24} color={theme.colors.gray[500]} />;
    }
  };

  // Renderera en tom lista
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open" size={64} color={theme.colors.gray[300]} />
        <Text style={styles.emptyText}>Inga resurser hittades</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={onCreateResource}
        >
          <Text style={styles.createButtonText}>Skapa resurs</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Visa laddningsindikator
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar resurser...</Text>
      </View>
    );
  }

  // Visa felmeddelande
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.red[500]} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchResources}
        >
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.gray[500]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Sök resurs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.gray[400]}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.gray[500]} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {renderTypeFilters()}
      
      <FlatList
        data={filteredResources}
        renderItem={renderResourceItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={
          filteredResources.length === 0 ? { flexGrow: 1 } : styles.listContent
        }
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // För bättre prestanda
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={onCreateResource}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  listContent: {
    paddingBottom: 80 // Ge plats för floating button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.gray[600]
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 20
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.gray[700],
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.gray[600],
    marginBottom: 20
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8
  },
  createButtonText: {
    color: theme.colors.white,
    fontWeight: '600'
  },
  resourceItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    alignItems: 'center'
  },
  resourceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  resourceContent: {
    flex: 1,
    marginRight: 10
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[900],
    marginBottom: 4
  },
  resourceDescription: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginBottom: 4
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resourceType: {
    fontSize: 12,
    backgroundColor: theme.colors.gray[200],
    color: theme.colors.gray[700],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8
  },
  resourceDate: {
    fontSize: 12,
    color: theme.colors.gray[500]
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    marginBottom: 8
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.gray[900],
    padding: 0
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[100],
    marginRight: 8
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.gray[700]
  },
  filterButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '500'
  }
}); 