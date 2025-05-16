import React, { useState, useCallback, memo } from 'react';
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

// Använd memo för att förhindra onödig rendering av komponenten
export const TeamActivitiesScreenPresentation: React.FC<TeamActivitiesScreenPresentationProps> = memo(({
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
  const toggleFilterMenu = useCallback(() => setFilterOpen(!filterOpen), [filterOpen]);
  
  // Hantera sökfrågeändring
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    const newFilterState = { ...filterState, search: query };
    setFilterState(newFilterState);
    onFilter(newFilterState);
  }, [filterState, onFilter]);
  
  // Hantera val av aktivitetstyp för filtrering
  const handleTypeFilter = useCallback((type: ActivityType) => {
    const newTypes = filterState.types.includes(type)
      ? filterState.types.filter(t => t !== type)
      : [...filterState.types, type];
    
    const newFilterState = { ...filterState, types: newTypes };
    setFilterState(newFilterState);
    onFilter(newFilterState);
  }, [filterState, onFilter]);
  
  // Hantera val av datumintervall
  const handleDateRangeFilter = useCallback((range: 'all' | 'today' | 'week' | 'month') => {
    const newFilterState = { ...filterState, dateRange: range };
    setFilterState(newFilterState);
    onFilter(newFilterState);
    setFilterOpen(false);
  }, [filterState, onFilter]);
  
  // Rensa alla filter
  const clearFilters = useCallback(() => {
    const emptyFilters = { types: [], dateRange: 'all', search: '' };
    setFilterState(emptyFilters);
    setSearchQuery('');
    onFilter(emptyFilters);
    setFilterOpen(false);
  }, [onFilter]);
  
  // Få ikon för aktivitetstyp
  const getActivityIcon = useCallback((type: string): string => {
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
  }, []);
  
  // Rendera aktivitetsraden - memoerad för att förbättra prestanda
  const renderActivityItem = useCallback(({ item }: { item: TeamActivityItem }) => (
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
  ), [onActivityPress, getActivityIcon]);
  
  // Rendera footer för listan med optimerad laddningslogik
  const renderFooter = useCallback(() => {
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
        <Button 
          mode="outlined" 
          onPress={onLoadMore} 
          style={styles.loadMoreButton}
          loading={isLoadingMore}
          disabled={isLoadingMore}
        >
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
  }, [hasMore, isLoadingMore, activities.length, onLoadMore]);
  
  // Hantera när listan når botten för oändlig scrollning
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);
  
  // Få titel med filter-information
  const getFilteredTitle = useCallback(() => {
    const parts = [];
    
    if (filterState.types.length > 0) {
      parts.push(`${filterState.types.length} typer`);
    }
    
    if (filterState.dateRange !== 'all') {
      parts.push(getDateRangeLabel(filterState.dateRange));
    }
    
    if (parts.length === 0) return 'Alla aktiviteter';
    
    return `Aktiviteter (${parts.join(', ')})`;
  }, [filterState.types, filterState.dateRange]);
  
  // Få läsbar etikett för datumintervall
  const getDateRangeLabel = useCallback((range: string): string => {
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
  }, []);
  
  // Få läsbar etikett för aktivitetstyp
  const getTypeLabel = useCallback((type: string): string => {
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
  }, []);
  
  // Få stil för typ-chip baserat på aktivitetstyp
  const getTypeChipStyle = useCallback((type: string) => {
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
        return styles.defaultChip;
    }
  }, []);
  
  // Renderingsfunktion för huvudinnehåll
  const renderContent = useCallback(() => {
    if (isLoading && !activities.length) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Laddar aktiviteter...</Text>
        </View>
      );
    }
    
    if (error && !activities.length) {
      return (
        <ErrorMessage 
          message={error.message}
          onRetry={error.retryable ? onRetry : undefined}
          context={{ teamId }}
        />
      );
    }
    
    // Visa aktivitetsstatistik
    const renderActivityStats = () => (
      <View style={styles.statsContainer}>
        <Text style={styles.statsSectionTitle}>Aktivitetsöversikt</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollView}>
          {Object.entries(activityStats || {}).map(([type, count]) => (
            <Chip 
              key={type}
              mode="outlined"
              selected={filterState.types.includes(type as ActivityType)}
              onPress={() => handleTypeFilter(type as ActivityType)}
              style={[styles.statChip, filterState.types.includes(type as ActivityType) && styles.selectedChip]}
            >
              {getTypeLabel(type)}: {count}
            </Chip>
          ))}
        </ScrollView>
      </View>
    );
    
    // Visa filter-område
    const renderFilterArea = () => (
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleContainer}>
            <Text style={styles.filterTitle}>
              {getFilteredTitle()}
            </Text>
            
            <Text style={styles.totalText}>
              {activities.length} av {total} aktiviteter
            </Text>
          </View>
          
          <Menu
            visible={filterOpen}
            onDismiss={toggleFilterMenu}
            anchor={
              <IconButton 
                icon="filter-variant" 
                onPress={toggleFilterMenu}
                style={[styles.filterButton, 
                  (filterState.types.length > 0 || filterState.dateRange !== 'all') 
                  && styles.activeFilterButton
                ]}
                iconColor={(filterState.types.length > 0 || filterState.dateRange !== 'all') 
                  ? '#0066cc' : '#666'}
              />
            }
          >
            <Menu.Item 
              title="Alla datum" 
              onPress={() => handleDateRangeFilter('all')}
              leadingIcon={filterState.dateRange === 'all' ? "check" : undefined}
            />
            <Menu.Item 
              title="Idag" 
              onPress={() => handleDateRangeFilter('today')}
              leadingIcon={filterState.dateRange === 'today' ? "check" : undefined}
            />
            <Menu.Item 
              title="Denna vecka" 
              onPress={() => handleDateRangeFilter('week')}
              leadingIcon={filterState.dateRange === 'week' ? "check" : undefined}
            />
            <Menu.Item 
              title="Denna månad" 
              onPress={() => handleDateRangeFilter('month')}
              leadingIcon={filterState.dateRange === 'month' ? "check" : undefined}
            />
            <Divider />
            <Menu.Item
              title="Rensa filter"
              onPress={clearFilters}
              leadingIcon="delete-sweep"
            />
          </Menu>
        </View>
        
        <Searchbar
          placeholder="Sök aktiviteter..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
    );
    
    return (
      <>
        {/* Visa bara statistik om det finns data */}
        {activityStats && Object.keys(activityStats).length > 0 && renderActivityStats()}
        
        {renderFilterArea()}
        
        {activities.length === 0 ? (
          <EmptyState
            title="Inga aktiviteter hittades"
            description={
              filterState.types.length > 0 || filterState.dateRange !== 'all' || filterState.search
                ? "Inga aktiviteter matchar dina filter"
                : "Det finns inga aktiviteter i detta team ännu"
            }
            actionLabel={
              filterState.types.length > 0 || filterState.dateRange !== 'all' || filterState.search
                ? "Rensa filter"
                : undefined
            }
            onAction={
              filterState.types.length > 0 || filterState.dateRange !== 'all' || filterState.search
                ? clearFilters
                : undefined
            }
            icon="history"
          />
        ) : (
          <>
            <FlatList
              data={activities}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item.id}
              ListFooterComponent={renderFooter}
              contentContainerStyle={styles.listContainer}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              refreshing={isLoading && activities.length > 0}
              onRefresh={onRefresh}
              ItemSeparatorComponent={() => <Divider />}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
            
            {error && activities.length > 0 && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error.message}</Text>
                {error.retryable && (
                  <Button 
                    mode="contained" 
                    onPress={onRetry}
                    style={styles.retryButton}
                  >
                    Försök igen
                  </Button>
                )}
              </View>
            )}
          </>
        )}
      </>
    );
  }, [
    isLoading, 
    activities, 
    activityStats, 
    error, 
    hasMore, 
    isLoadingMore,
    total,
    filterState,
    searchQuery,
    filterOpen,
    onRetry,
    onRefresh,
    onLoadMore,
    teamId,
    renderActivityItem,
    renderFooter,
    handleEndReached,
    getFilteredTitle,
    getTypeLabel,
    handleTypeFilter,
    toggleFilterMenu,
    handleDateRangeFilter,
    clearFilters,
    handleSearchChange
  ]);
  
  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={`${teamName} - Aktiviteter`} />
        <Appbar.Action icon="refresh" onPress={onRefresh} disabled={isLoading} />
      </Appbar.Header>
      
      <View style={styles.container}>
        {renderContent()}
      </View>
    </Screen>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  statsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  statsScrollView: {
    marginBottom: 8
  },
  statChip: {
    marginRight: 8,
    backgroundColor: '#f0f0f0'
  },
  selectedChip: {
    backgroundColor: '#e6f2ff',
    borderColor: '#0066cc'
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  filterTitleContainer: {
    flex: 1
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  totalText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  filterButton: {
    margin: 0,
    backgroundColor: '#f0f0f0'
  },
  activeFilterButton: {
    backgroundColor: '#e6f2ff'
  },
  searchBar: {
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9'
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 16
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 12,
    color: '#666'
  },
  timeText: {
    fontSize: 12,
    color: '#888'
  },
  typeChip: {
    height: 24,
    alignSelf: 'center'
  },
  messageChip: {
    backgroundColor: '#e1f5fe'
  },
  taskChip: {
    backgroundColor: '#e8f5e9'
  },
  memberAddedChip: {
    backgroundColor: '#e0f7fa'
  },
  memberRemovedChip: {
    backgroundColor: '#ffebee'
  },
  roleChangedChip: {
    backgroundColor: '#ede7f6'
  },
  fileUploadedChip: {
    backgroundColor: '#e8eaf6'
  },
  defaultChip: {
    backgroundColor: '#f5f5f5'
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666'
  },
  loadMoreButton: {
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'center'
  },
  endOfListText: {
    textAlign: 'center',
    color: '#666',
    padding: 16
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  errorText: {
    color: '#c62828',
    flex: 1,
    marginRight: 8
  },
  retryButton: {
    backgroundColor: '#c62828'
  }
}); 