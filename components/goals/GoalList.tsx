import React, { useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  useWindowDimensions
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/context/ThemeContext';
import { Goal, GoalFilter } from '@/types/goal';
import { TouchableGoalCard } from './TouchableGoalCard';
import { GoalStatistics } from './GoalStatistics';
import { useGoals } from '@/hooks/useGoals';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Search, AlertCircle, ListFilter } from 'lucide-react-native';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface GoalListProps {
  filter?: GoalFilter;
  onGoalPress?: (goal: Goal) => void;
  refreshTrigger?: number;
  listHeaderComponent?: React.ReactElement;
  emptyStateComponent?: React.ReactElement;
  showFilters?: boolean;
  showStatistics?: boolean;
  teamView?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  bottomSpacerHeight?: number;
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
  showStatistics = false,
  teamView = false,
  variant = 'default',
  bottomSpacerHeight = 80
}) => {
  const { colors } = useTheme();
  const { containerStyle, cardStyle, gridStyle } = useResponsiveLayout();
  
  const [localFilter, setLocalFilter] = React.useState<GoalFilter>(filter);
  const [searchText, setSearchText] = React.useState('');
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);

  React.useEffect(() => {
    setLocalFilter({ ...filter });
  }, [filter]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (text.trim()) {
      setLocalFilter(prev => ({ ...prev, search: text }));
    } else {
      const { search, ...rest } = localFilter;
      setLocalFilter(rest);
    }
  }, [localFilter]);

  const { 
    data: goalData, 
    isLoading, 
    isError, 
    refetch,
    isFetching
  } = useGoals(localFilter, {
    keepPreviousData: true,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000
  });

  const goals = useMemo(() => 
    goalData?.goals ?? [], 
    [goalData?.goals]
  );

  React.useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const renderGoal = useCallback(({ item }: { item: Goal }) => (
    <View style={[styles.goalCardContainer, cardStyle]}>
      <TouchableGoalCard 
        goal={item} 
        onPress={onGoalPress}
        onSwipeComplete={(goal) => {
          // Implementera svep-logik här
        }}
      />
    </View>
  ), [cardStyle, onGoalPress]);

  const EmptyState = useMemo(() => {
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
  }, [isLoading, emptyStateComponent, colors, searchText]);

  const Filters = useMemo(() => {
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
  }, [showFilters, searchText, handleSearch, colors, isFilterVisible]);

  const Header = useMemo(() => (
    <>
      {showStatistics && goals.length > 0 && (
        <GoalStatistics goals={goals} teamView={teamView} />
      )}
      {Filters}
      {listHeaderComponent}
    </>
  ), [Filters, listHeaderComponent, showStatistics, goals, teamView]);

  const Footer = useMemo(() => (
    <View>
      {isFetching && !isLoading && (
        <View style={styles.footerContainer}>
          <ActivityIndicator color={colors.primary.main} />
        </View>
      )}
      <View style={{ height: bottomSpacerHeight }} />
    </View>
  ), [isFetching, isLoading, colors, bottomSpacerHeight]);

  if (isError) {
    return (
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
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <FlashList
        data={goals}
        renderItem={renderGoal}
        estimatedItemSize={200}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        ListEmptyComponent={EmptyState}
        ListFooterComponent={Footer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary.main}
          />
        }
        numColumns={gridStyle.columnCount}
        columnWrapperStyle={gridStyle.columnCount > 1 ? {
          justifyContent: 'space-between',
          marginHorizontal: -gridStyle.spacing
        } : undefined}
        contentContainerStyle={styles.listContent}
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
  },
  goalCardContainer: {
    marginBottom: 16,
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