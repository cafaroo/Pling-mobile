import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/context/ThemeContext';
import { Goal, GoalStatus } from '@/types/goal';
import { Award, TrendingUp, Target, Users } from 'lucide-react-native';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GoalStatisticsProps {
  goals: Goal[];
  teamView?: boolean;
}

interface StatCard {
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: number;
  color?: string;
}

export const GoalStatistics: React.FC<GoalStatisticsProps> = ({ 
  goals,
  teamView = false 
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { containerStyle } = useResponsiveLayout();

  // Beräkna statistik
  const statistics = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalGoals = goals.length;
    
    const completionRate = totalGoals > 0 
      ? Math.round((completedGoals / totalGoals) * 100) 
      : 0;

    const onTrackGoals = goals.filter(g => {
      const deadline = new Date(g.deadline);
      const now = new Date();
      const progress = (g.current / g.target) * 100;
      const timeProgress = (now.getTime() - new Date(g.created_at).getTime()) /
        (deadline.getTime() - new Date(g.created_at).getTime()) * 100;
      
      return progress >= timeProgress;
    }).length;

    const onTrackRate = totalGoals > 0 
      ? Math.round((onTrackGoals / totalGoals) * 100)
      : 0;

    return {
      activeGoals,
      completedGoals,
      completionRate,
      onTrackRate,
      totalGoals
    };
  }, [goals]);

  // Förbereda data för grafen
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    const labels = last6Months.map(date => 
      `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
    );

    const datasets = [{
      data: last6Months.map(date => {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        return goals.filter(goal => {
          const completedDate = new Date(goal.completed_at || '');
          return goal.status === 'completed' && 
            completedDate >= monthStart && 
            completedDate <= monthEnd;
        }).length;
      }),
      color: () => colors.accent.yellow,
    }];

    return { labels, datasets };
  }, [goals, colors]);

  // Förbereda statistikkort
  const statCards: StatCard[] = useMemo(() => [
    {
      icon: TrendingUp,
      title: 'Aktiva mål',
      value: statistics.activeGoals,
      color: colors.accent.blue
    },
    {
      icon: Award,
      title: 'Avklarade',
      value: `${statistics.completionRate}%`,
      color: colors.accent.yellow
    },
    {
      icon: Target,
      title: 'I tid',
      value: `${statistics.onTrackRate}%`,
      color: colors.accent.green
    },
    {
      icon: Users,
      title: teamView ? 'Teammedlemmar' : 'Team-relaterade',
      value: teamView ? goals.reduce((acc, goal) => 
        acc.add(goal.assignee_id), new Set()).size : 
        goals.filter(g => g.team_id).length,
      color: colors.accent.purple
    }
  ], [statistics, colors, teamView, goals]);

  const renderStatCard = (stat: StatCard) => {
    const Icon = stat.icon;
    
    return (
      <Animated.View 
        key={stat.title} 
        entering={FadeIn.delay(200)}
        style={styles.statCard}
      >
        <BlurView intensity={20} style={styles.cardBlur}>
          <Icon size={24} color={stat.color} />
          <Text style={[styles.statValue, { color: colors.text.main }]}>
            {stat.value}
          </Text>
          <Text style={[styles.statTitle, { color: colors.text.light }]}>
            {stat.title}
          </Text>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.statsGrid}>
        {statCards.map(renderStatCard)}
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text.main }]}>
          Avklarade mål över tid
        </Text>
        <LineChart
          data={chartData}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: colors.background.main,
            backgroundGradientFrom: colors.background.light,
            backgroundGradientTo: colors.background.dark,
            decimalPlaces: 0,
            color: (opacity = 1) => colors.accent.yellow,
            labelColor: (opacity = 1) => colors.text.light,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: colors.accent.yellow
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBlur: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 