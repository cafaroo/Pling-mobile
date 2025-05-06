import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Goal, GoalFilter } from '@/types/goal';
import { GoalCard } from './GoalCard';
import { useGoals } from '@/hooks/useGoals';
import { Search, AlertCircle, ListFilter } from 'lucide-react-native';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface GoalListProps {
  filter?: GoalFilter;
  onGoalPress?: (goal: Goal) => void;
  refreshTrigger?: number; // Används för att tvinga en uppdatering
  listHeaderComponent?: React.ReactElement;
  emptyStateComponent?: React.ReactElement;
  showFilters?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  bottomSpacerHeight?: number; // Ny prop för bottom spacer höjd
}

/**
 * GoalList - En komponent för att visa en lista av mål
 */
export const GoalList: React.FC<GoalListProps> = ({
  filter = {},
  onGoalPress,
  refreshTrigger,
  listHeaderComponent,
  emptyStateComponent,
  showFilters = true,
  variant = 'default',
  bottomSpacerHeight = 80 // Standardvärde för bottom spacer
}) => {
  const { colors } = useTheme();
  const [localFilter, setLocalFilter] = React.useState<GoalFilter>(filter);
  const [searchText, setSearchText] = React.useState('');
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);
  
  // Uppdatera lokalfilter när utomstående filter ändras
  React.useEffect(() => {
    setLocalFilter({ ...filter });
  }, [filter]);
  
  // Hantera sökning
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim()) {
      setLocalFilter(prev => ({ ...prev, search: text }));
    } else {
      const { search, ...rest } = localFilter;
      setLocalFilter(rest);
    }
  };
  
  // Hämta mål med React Query
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    isFetching,
    hasNextPage,
    fetchNextPage
  } = useGoals(localFilter, {
    keepPreviousData: true
  });
  
  // Hantera refresh
  React.useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);
  
  // Hantera paginering
  const handleLoadMore = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage();
    }
  };
  
  // Rendrera ett mål
  const renderGoal = ({ item }: { item: Goal }) => (
    <GoalCard 
      goal={item} 
      onPress={onGoalPress}
      variant={variant}
    />
  );
  
  // Rendrera tom lista
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (emptyStateComponent) {
      return emptyStateComponent;
    }
    
    return (
      <Animated.View 
        style={styles.emptyStateContainer} 
        entering={FadeIn}
        exiting={FadeOut}
      >
        <Text style={[styles.emptyStateTitle, { color: colors.text.main }]}>
          Inga mål hittades
        </Text>
        <Text style={[styles.emptyStateText, { color: colors.text.light }]}>
          {searchText.trim() 
            ? 'Prova att ändra sökfrågan eller ta bort filter'
            : 'Skapa ett nytt mål för att komma igång'}
        </Text>
      </Animated.View>
    );
  };
  
  // Rendrera felmeddelande
  const renderError = () => (
    <View style={styles.errorContainer}>
      <AlertCircle size={24} color={colors.error} />
      <Text style={[styles.errorText, { color: colors.error }]}>
        Kunde inte ladda mål
      </Text>
      <Button 
        title="Försök igen" 
        onPress={() => refetch()}
        variant="outline"
        style={styles.retryButton}
      />
    </View>
  );
  
  // Rendrera filter
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Sök efter mål..."
            style={styles.searchInput}
            leftIcon={<Search size={18} color={colors.text.light} />}
          />
          <Button
            title=""
            icon={ListFilter}
            variant="outline"
            onPress={() => setIsFilterVisible(!isFilterVisible)}
            style={styles.filterButton}
          />
        </View>
        
        {isFilterVisible && (
          <Animated.View 
            style={styles.filterPanel}
            entering={FadeIn}
            exiting={FadeOut}
          >
            {/* Filter-kontroller kan läggas till här */}
          </Animated.View>
        )}
      </View>
    );
  };
  
  // Rendrera header för listan
  const renderHeader = () => (
    <>
      {renderFilters()}
      {listHeaderComponent}
    </>
  );
  
  // Rendrera footer för listan (laddningsindikator och bottom spacer)
  const renderFooter = () => (
    <View>
      {isFetching && !isLoading && (
        <View style={styles.footerContainer}>
          <ActivityIndicator color={colors.primary.main} />
        </View>
      )}
      <View style={{ height: bottomSpacerHeight }} />
    </View>
  );
  
  // Om det är fel, visa felmeddelande
  if (isError) {
    return renderError();
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={data?.goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  filterPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}); 