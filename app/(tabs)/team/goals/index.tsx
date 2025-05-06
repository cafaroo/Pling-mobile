import React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Plus, ArrowLeft, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useActiveTeam } from '@/hooks/useTeam';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Tabs from '@/components/ui/Tabs';
import { GoalList } from '@/components/goals/GoalList';
import { GoalStats } from '@/components/goals/GoalStats';
import { GoalFilters } from '@/components/goals/GoalFilters';
import { Goal, GoalFilter, GoalStatus } from '@/types/goal';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function TeamGoalsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { activeTeam, isTeamAdmin } = useActiveTeam();
  const router = useRouter();
  
  // Tillstånd för filtrering och sortering
  const [activeTab, setActiveTab] = useState<GoalStatus | 'all'>('active');
  const [filter, setFilter] = useState<GoalFilter>({});
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Uppdatera filter när tabb byts
  useEffect(() => {
    if (activeTab === 'all') {
      setFilter(current => ({ ...current, status: undefined }));
    } else {
      setFilter(current => ({ ...current, status: [activeTab] }));
    }
  }, [activeTab]);
  
  // Hantera när ett mål klickas på
  const handleGoalPress = (goal: Goal) => {
    router.push(`/team/goals/${goal.id}`);
  };
  
  // Hantera när filter ändras
  const handleFilterChange = (newFilter: GoalFilter) => {
    setFilter(newFilter);
    setIsFilterVisible(false);
  };
  
  // Animera filterpanelen
  const filterHeight = useSharedValue(0);
  
  useEffect(() => {
    filterHeight.value = withTiming(isFilterVisible ? 400 : 0, { duration: 300 });
  }, [isFilterVisible]);
  
  const filterStyle = useAnimatedStyle(() => ({
    height: filterHeight.value,
    opacity: filterHeight.value > 0 ? 1 : 0,
    overflow: 'hidden'
  }));
  
  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Teammål" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.push('/team')}
        rightIcon={Filter}
        onRightIconPress={() => setIsFilterVisible(!isFilterVisible)}
      />
      
      <Tabs
        tabs={[
          { id: 'active', label: 'Aktiva' },
          { id: 'completed', label: 'Avklarade' },
          { id: 'all', label: 'Alla' },
        ]}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab as GoalStatus | 'all')}
      />
      
      <Animated.View style={filterStyle}>
        <GoalFilters
          initialFilter={filter}
          onFilterChange={handleFilterChange}
          onClose={() => setIsFilterVisible(false)}
          allowScopeFilter={false}
        />
      </Animated.View>
      
      <GoalList
        filter={{
          ...filter,
          teamId: activeTeam?.id,
          scope: 'team'
        }}
        onGoalPress={handleGoalPress}
        refreshTrigger={refreshTrigger}
        listHeaderComponent={
          <GoalStats
            teamId={activeTeam?.id}
            scope="team"
            onStatPress={(statType) => {
              // Hantera statistikklick om det behövs
              if (statType === 'active') {
                setActiveTab('active');
              } else if (statType === 'completed') {
                setActiveTab('completed');
              }
            }}
          />
        }
        showFilters={false}
        bottomSpacerHeight={80}
      />
      
      {isTeamAdmin && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent.yellow }]}
          onPress={() => router.push('/team/goals/create')}
          activeOpacity={0.8}
        >
          <Plus color={colors.background.dark} size={24} />
        </TouchableOpacity>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});