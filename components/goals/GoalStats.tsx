import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Award, TrendingUp, Users, Target } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GoalScope } from '@/types/goal';
import { useUserGoalStats, useTeamGoalStats } from '@/hooks/useGoals';

interface GoalStatsProps {
  userId?: string;
  teamId?: string;
  scope: GoalScope;
  onStatPress?: (statType: string) => void;
}

/**
 * GoalStats - En komponent för att visa statistik om mål
 */
export const GoalStats: React.FC<GoalStatsProps> = ({
  userId,
  teamId,
  scope,
  onStatPress
}) => {
  const { colors } = useTheme();
  
  // Hämta statistik baserat på scope
  const userStats = useUserGoalStats(userId, {
    enabled: scope === 'individual' && !!userId
  });
  
  const teamStats = useTeamGoalStats(teamId, {
    enabled: scope === 'team' && !!teamId
  });
  
  // Bestäm vilka stats som ska visas baserat på scope
  const activeGoals = scope === 'team' 
    ? teamStats.data?.activeGoals || 0
    : userStats.data?.activeGoals || 0;
    
  const completedGoals = scope === 'team'
    ? teamStats.data?.completedGoals || 0
    : userStats.data?.completedGoals || 0;
    
  const thirdStat = scope === 'team'
    ? teamStats.data?.topContributors?.length || 0
    : userStats.data?.teamContributions || 0;
  
  const isLoading = (scope === 'team' ? teamStats.isLoading : userStats.isLoading);
  
  // Rendrera ett statistikkort
  const renderStatCard = (
    Icon: React.ElementType,
    title: string,
    value: number | string,
    isHighlighted: boolean,
    statType: string
  ) => (
    <TouchableOpacity
      style={styles.statCardContainer}
      onPress={() => onStatPress && onStatPress(statType)}
    >
      <BlurView 
        intensity={20} 
        tint="dark" 
        style={[
          styles.statCard,
          { backgroundColor: isHighlighted ? 'rgba(255, 201, 60, 0.1)' : 'rgba(60, 60, 90, 0.2)' }
        ]}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: isHighlighted ? colors.accent.yellow + '30' : 'rgba(255, 255, 255, 0.1)' }
        ]}>
          <Icon size={18} color={isHighlighted ? colors.accent.yellow : colors.text.light} />
        </View>
        
        <Text style={[styles.statValue, { 
          color: isHighlighted ? colors.accent.yellow : colors.text.main 
        }]}>
          {value}
        </Text>
        
        <Text style={[styles.statTitle, { color: colors.text.light }]}>
          {title}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );
  
  // Skipmount-animation om data laddas
  if (isLoading) {
    return (
      <View style={styles.container}>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.statCardContainer}>
            <BlurView 
              intensity={20} 
              tint="dark" 
              style={[styles.statCard, { backgroundColor: 'rgba(60, 60, 90, 0.2)' }]}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
              <View style={[styles.skeletonValue, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
              <View style={[styles.skeletonTitle, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
            </BlurView>
          </View>
        ))}
      </View>
    );
  }
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
    >
      {renderStatCard(
        TrendingUp,
        'Aktiva',
        activeGoals,
        activeGoals > 0,
        'active'
      )}
      
      {renderStatCard(
        Award,
        'Avklarade',
        completedGoals,
        false,
        'completed'
      )}
      
      {scope === 'team' ? 
        renderStatCard(
          Users,
          'Bidragsgivare',
          thirdStat,
          thirdStat > 2,
          'contributors'
        ) :
        renderStatCard(
          Target,
          'Bidrar till',
          thirdStat,
          thirdStat > 0,
          'teamContributions'
        )
      }
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCardContainer: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCard: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  skeletonValue: {
    width: 40,
    height: 22,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTitle: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
}); 