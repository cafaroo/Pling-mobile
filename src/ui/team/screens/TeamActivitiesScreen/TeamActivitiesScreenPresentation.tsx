import React, { useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Appbar, Text, Divider, List, Chip, Menu, Button, Searchbar, IconButton } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { ActivityType } from '@/domain/team/value-objects/ActivityType';

export interface TeamActivityItem extends TeamActivity {
  performedByName: string;
  targetName?: string;
  timestamp: string;
}

interface ActivityFilterState {
  types: ActivityType[];
  dateRange: 'all' | 'today' | 'week' | 'month';
  search: string;
}

export interface TeamActivitiesScreenPresentationProps {
  // Data
  teamId: string;
  teamName: string;
  activities: TeamActivityItem[];
  hasMore: boolean;
  total: number;
  activityStats: Record<ActivityType, number>;
  
  // Tillstånd
  isLoading: boolean;
  isLoadingMore: boolean;
  error?: {
    message: string;
    retryable?: boolean;
  };
  
  // Callbacks
  onBack: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onFilter: (filter: ActivityFilterState) => void;
  onRefresh: () => void;
  onActivityPress: (activityId: string) => void;
}

export const TeamActivitiesScreenPresentation: React.FC<TeamActivitiesScreenPresentationProps> = ({
  teamId,
  teamName,
  activities,
  hasMore,
  total,
  activityStats,
  isLoading,
  isLoadingMore,
  error,
  onBack,
  onRetry,
  onLoadMore,
  onFilter,
  onRefresh,
  onActivityPress
}) => {
  // Tillstånd för filtrering
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState<ActivityFilterState>({
    types: [],
    dateRange: 'all',
    search: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Visa filtermenyn
  const toggleFilterMenu = () => setFilterOpen(!filterOpen);
  
  // Hantera sökfrågeändring
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilterState(prev => ({ ...prev, search: query }));
    onFilter({ ...filterState, search: query });
  };
  
  // Hantera val av aktivitetstyp för filtrering
  const handleTypeFilter = (type: ActivityType) => {
    const newTypes = filterState.types.includes(type)
      ? filterState.types.filter(t => t !== type)
      : [...filterState.types, type];
    
    setFilterState(prev => ({ ...prev, types: newTypes }));
    onFilter({ ...filterState, types: newTypes });
  };
  
  // Hantera val av datumintervall
  const handleDateRangeFilter = (range: 'all' | 'today' | 'week' | 'month') => {
    setFilterState(prev => ({ ...prev, dateRange: range }));
    onFilter({ ...filterState, dateRange: range });
    setFilterOpen(false);
  };
  
  // Rensa alla filter
  const clearFilters = () => {
    setFilterState({ types: [], dateRange: 'all', search: '' });
    setSearchQuery('');
    onFilter({ types: [], dateRange: 'all', search: '' });
    setFilterOpen(false);
  };
  
  // Få ikon för aktivitetstyp
  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'message':
        return 'message-text';
      case 'task':
        return 'checkbox-marked';
      case 'member_added':
        return 'account-plus';
      case 'member_removed':
        return 'account-minus';
      case 'role_changed':
        return 'account-cog';
      case 'file_uploaded':
        return 'file-upload';
      default:
        return 'information';
    }
  };
  
  // Rendera aktivitetsraden
  const renderActivityItem = ({ item }: { item: TeamActivityItem }) => (
    <TouchableOpacity onPress={() => onActivityPress(item.id)}>
      <List.Item
        title={item.title}
        description={
          <>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>
                Av: {item.performedByName}
                {item.targetName && ` • Till: ${item.targetName}`}
              </Text>
              <Text style={styles.timeText}>{item.timestamp}</Text>
            </View>
          </>
        }
        left={props => <List.Icon {...props} icon={getActivityIcon(item.type)} />}
        right={props => (
          <Chip size={20} style={[styles.typeChip, getTypeChipStyle(item.type)]}>
            {getTypeLabel(item.type)}
          </Chip>
        )}
      />
    </TouchableOpacity>
  );
  
  // Rendera footer för listan
  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.loadMoreText}>Laddar fler...</Text>
        </View>
      );
    }
    
    if (hasMore) {
      return (
        <Button mode="outlined" onPress={onLoadMore} style={styles.loadMoreButton}>
          Ladda fler aktiviteter
        </Button>
      );
    }
    
    if (activities.length > 0) {
      return (
        <Text style={styles.endOfListText}>
          Slut på aktiviteter
        </Text>
      );
    }
    
    return null;
  };
  
  // Få titel med filter-information
  const getFilteredTitle = () => {
    const parts = [];
    
    if (filterState.types.length > 0) {
      parts.push(`${filterState.types.length} typer`);
    }
    
    if (filterState.dateRange !== 'all') {
      parts.push(getDateRangeLabel(filterState.dateRange));
    }
    
    if (parts.length === 0) return 'Alla aktiviteter';
    
    return `Aktiviteter (${parts.join(', ')})`;
  };
  
  // Få läsbar etikett för datumintervall
  const getDateRangeLabel = (range: string): string => {
    switch (range) {
      case 'today':
        return 'Idag';
      case 'week':
        return 'Denna vecka';
      case 'month':
        return 'Denna månad';
      default:
        return 'Alla datum';
    }
  };
  
  // Få läsbar etikett för aktivitetstyp
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'message':
        return 'Meddelande';
      case 'task':
        return 'Uppgift';
      case 'member_added':
        return 'Ny medlem';
      case 'member_removed':
        return 'Medlem borttagen';
      case 'role_changed':
        return 'Roll ändrad';
      case 'file_uploaded':
        return 'Fil uppladdad';
      default:
        return type;
    }
  };
  
  // Få stil för typ-chip baserat på aktivitetstyp
  const getTypeChipStyle = (type: string) => {
    switch (type) {
      case 'message':
        return styles.messageChip;
      case 'task':
        return styles.taskChip;
      case 'member_added':
        return styles.memberAddedChip;
      case 'member_removed':
        return styles.memberRemovedChip;
      case 'role_changed':
        return styles.roleChangedChip;
      case 'file_uploaded':
        return styles.fileUploadedChip;
      default:
        return {};
    }
  };
  
  // Renderingsfunktion för innehåll
  const renderContent = () => {
    if (isLoading && activities.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Laddar aktiviteter...</Text>
        </View>
      );
    }
    
    if (error && activities.length === 0) {
      return (
        <ErrorMessage 
          message={error.message}
          onRetry={error.retryable ? onRetry : undefined}
        />
      );
    }
    
    if (activities.length === 0) {
      return (
        <EmptyState
          title="Inga aktiviteter"
          description="Det finns inga aktiviteter att visa för detta team ännu."
          icon="history"
        />
      );
    }
    
    return (
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        onEndReached={() => hasMore && !isLoadingMore && onLoadMore()}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContainer}
      />
    );
  };
  
  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={`${teamName} - Aktiviteter`} />
        <Appbar.Action icon="refresh" onPress={onRefresh} />
      </Appbar.Header>
      
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <Searchbar
            placeholder="Sök aktiviteter"
            onChangeText={handleSearchChange}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <Menu
            visible={filterOpen}
            onDismiss={() => setFilterOpen(false)}
            anchor={
              <IconButton
                icon="filter"
                size={24}
                onPress={toggleFilterMenu}
                style={styles.filterButton}
              />
            }
            style={styles.filterMenu}
          >
            <Menu.Item title="Välj datumintervall" disabled />
            <Divider />
            <Menu.Item
              onPress={() => handleDateRangeFilter('all')}
              title="Alla datum"
              leadingIcon={filterState.dateRange === 'all' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleDateRangeFilter('today')}
              title="Idag"
              leadingIcon={filterState.dateRange === 'today' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleDateRangeFilter('week')}
              title="Denna vecka"
              leadingIcon={filterState.dateRange === 'week' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleDateRangeFilter('month')}
              title="Denna månad" 
              leadingIcon={filterState.dateRange === 'month' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item
              onPress={clearFilters}
              title="Rensa filter"
              leadingIcon="delete-sweep"
            />
          </Menu>
        </View>
        
        <View style={styles.typeFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(activityStats).map((type) => (
              <Chip
                key={type}
                selected={filterState.types.includes(type as ActivityType)}
                onPress={() => handleTypeFilter(type as ActivityType)}
                style={[styles.filterChip, getTypeChipStyle(type)]}
                icon={getActivityIcon(type)}
              >
                {getTypeLabel(type)} ({activityStats[type as ActivityType]})
              </Chip>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Visar {activities.length} av {total} aktiviteter
          </Text>
          <Text style={styles.titleText}>{getFilteredTitle()}</Text>
        </View>
        
        {renderContent()}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    margin: 0,
  },
  filterMenu: {
    marginTop: 40,
  },
  typeFilterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 12,
    color: '#757575',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  listContainer: {
    flexGrow: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#757575',
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
  },
  description: {
    fontSize: 14,
    color: '#212121',
  },
  typeChip: {
    height: 24,
    alignSelf: 'center',
  },
  messageChip: {
    backgroundColor: '#e3f2fd',
  },
  taskChip: {
    backgroundColor: '#e8f5e9',
  },
  memberAddedChip: {
    backgroundColor: '#e0f7fa',
  },
  memberRemovedChip: {
    backgroundColor: '#ffebee',
  },
  roleChangedChip: {
    backgroundColor: '#fff3e0',
  },
  fileUploadedChip: {
    backgroundColor: '#f3e5f5',
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    color: '#757575',
  },
  loadMoreButton: {
    margin: 16,
  },
  endOfListText: {
    textAlign: 'center',
    padding: 16,
    color: '#757575',
  },
}); 