import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, Button, Divider, IconButton, useTheme } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { UniqueId } from '@/domain/core/UniqueId';
import { 
  TeamStatistics, 
  StatisticsPeriod,
  ActivityTrend
} from '@/domain/team/value-objects/TeamStatistics';
import { ActivityType, ActivityCategories } from '@/domain/team/value-objects/ActivityType';
import { GoalStatus } from '@/domain/team/entities/TeamGoal';
import { useTeamStatistics, useTeamStatisticsTrend } from '@/application/team/hooks/useTeamStatistics';
import { formatDate, getStartOfPeriod, getEndOfPeriod } from '@/utils/dateUtils';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

interface TeamStatisticsDashboardProps {
  teamId: UniqueId;
}

export function TeamStatisticsDashboard({ teamId }: TeamStatisticsDashboardProps) {
  const theme = useTheme();
  const [activePeriod, setActivePeriod] = useState<StatisticsPeriod>(StatisticsPeriod.WEEKLY);
  const [comparisonPeriod, setComparisonPeriod] = useState<boolean>(false);
  
  const endDate = new Date();
  const startDate = getStartOfPeriod(endDate, activePeriod);
  
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = getStartOfPeriod(previousEndDate, activePeriod);
  
  const { 
    statistics, 
    isLoading: isLoadingCurrent,
    error: currentError
  } = useTeamStatistics(teamId.toString(), activePeriod);
  
  const { 
    data: previousStatistics, 
    isLoading: isLoadingPrevious 
  } = useTeamStatisticsTrend(
    teamId, 
    activePeriod,
    previousStartDate,
    previousEndDate,
    { enabled: comparisonPeriod }
  );
  
  const isLoading = isLoadingCurrent || (comparisonPeriod && isLoadingPrevious);
  
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Laddar statistik...</Text>
      </View>
    );
  }
  
  if (!statistics) {
    return (
      <View style={styles.centered}>
        <Text>Ingen statistik tillgänglig</Text>
      </View>
    );
  }
  
  // Beräkna förändringsprocent
  const calculateChange = (current: number, previous: number | undefined): { value: number; positive: boolean } => {
    if (previous === undefined || previous === 0) return { value: 0, positive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), positive: change >= 0 };
  };
  
  // Aktivitetstrend data
  const trendData = {
    labels: statistics.activityTrend.map(trend => formatDate(trend.date, activePeriod)),
    datasets: [{
      data: statistics.activityTrend.map(trend => trend.count),
      color: () => theme.colors.primary,
      strokeWidth: 2
    }]
  };
  
  // Målstatistik data
  const goalData = {
    labels: Object.keys(statistics.goalsByStatus).map(status => 
      formatGoalStatus(status as unknown as GoalStatus)
    ),
    data: Object.values(statistics.goalsByStatus)
  };
  
  // Aktivitetsfördelning per kategori
  const categoryData = Object.entries(ActivityCategories).map(([key, value]) => ({
    name: value,
    count: statistics.activityBreakdown?.[key as keyof typeof ActivityCategories] || 0,
    color: getCategoryColor(key as keyof typeof ActivityCategories, theme),
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12
  }));
  
  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary + opacity * 255,
    strokeWidth: 2,
    decimalPlaces: 0,
    labelColor: () => theme.colors.onSurface,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.periodSelector}>
        {Object.values(StatisticsPeriod).map(period => (
          <Button
            key={period}
            mode={period === activePeriod ? 'contained' : 'outlined'}
            onPress={() => setActivePeriod(period)}
            style={styles.periodButton}
          >
            {getPeriodLabel(period)}
          </Button>
        ))}
      </View>
      
      <Button
        mode={comparisonPeriod ? 'contained' : 'outlined'}
        onPress={() => setComparisonPeriod(!comparisonPeriod)}
        style={styles.comparisonButton}
      >
        {comparisonPeriod ? 'Dölj jämförelse' : 'Visa jämförelse'}
      </Button>
      
      <Card style={styles.card}>
        <Card.Title title="Aktivitetssummering" />
        <Card.Content>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Aktiviteter" 
              value={statistics.activityCount}
              previousValue={comparisonPeriod ? (previousStatistics?.[0]?.activityCount || 0) : undefined}
            />
            <StatCard 
              title="Avslutade mål" 
              value={statistics.completedGoals}
              previousValue={comparisonPeriod ? (previousStatistics?.[0]?.completedGoals || 0) : undefined}
            />
            <StatCard 
              title="Aktiva mål" 
              value={statistics.activeGoals}
              previousValue={comparisonPeriod ? (previousStatistics?.[0]?.activeGoals || 0) : undefined}
            />
            <StatCard 
              title="Deltagande medlemmar" 
              value={statistics.memberParticipation}
              previousValue={comparisonPeriod ? (previousStatistics?.[0]?.memberParticipation || 0) : undefined}
            />
          </View>
          
          <View style={styles.progressSection}>
            <Text variant="titleMedium">Genomsnittligt målframsteg</Text>
            <View style={styles.progressRow}>
              <Text variant="displaySmall">
                {Math.round(statistics.averageGoalProgress)}%
              </Text>
              {comparisonPeriod && previousStatistics?.[0] && (
                <View style={styles.changeIndicator}>
                  <Text 
                    style={{ 
                      color: calculateChange(
                        statistics.averageGoalProgress, 
                        previousStatistics[0].averageGoalProgress
                      ).positive ? theme.colors.primary : theme.colors.error 
                    }}
                  >
                    {calculateChange(
                      statistics.averageGoalProgress, 
                      previousStatistics[0].averageGoalProgress
                    ).positive ? '▲' : '▼'} 
                    {calculateChange(
                      statistics.averageGoalProgress, 
                      previousStatistics[0].averageGoalProgress
                    ).value}%
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${statistics.averageGoalProgress}%`, backgroundColor: theme.colors.primary }
                ]}
              />
              {comparisonPeriod && previousStatistics?.[0] && (
                <View 
                  style={[
                    styles.progressFillPrevious,
                    { 
                      width: `${previousStatistics[0].averageGoalProgress}%`, 
                      backgroundColor: theme.colors.secondary 
                    }
                  ]}
                />
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Aktivitetstrend" />
        <Card.Content>
          <LineChart
            data={trendData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Mål per status" />
        <Card.Content>
          <BarChart
            data={{
              labels: goalData.labels,
              datasets: [{
                data: goalData.data,
              }]
            }}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </Card.Content>
      </Card>
      
      {categoryData.some(item => item.count > 0) && (
        <Card style={styles.card}>
          <Card.Title title="Aktiviteter per kategori" />
          <Card.Content>
            <PieChart
              data={categoryData.filter(item => item.count > 0)}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      )}
      
      <View style={styles.lastUpdated}>
        <Text variant="bodySmall">
          Senast uppdaterad: {formatDate(statistics.lastUpdated, StatisticsPeriod.DAILY, true)}
        </Text>
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
}

function StatCard({ title, value, previousValue }: StatCardProps) {
  const theme = useTheme();
  const change = previousValue !== undefined 
    ? calculateChange(value, previousValue) 
    : undefined;
    
  return (
    <View style={styles.statCard}>
      <Text variant="bodyMedium">{title}</Text>
      <Text variant="headlineMedium">{value}</Text>
      {change && (
        <Text 
          style={{ 
            color: change.positive ? theme.colors.primary : theme.colors.error,
            ...styles.changeText
          }}
        >
          {change.positive ? '▲' : '▼'} {change.value}%
        </Text>
      )}
    </View>
  );
}

function calculateChange(current: number, previous: number | undefined): { value: number; positive: boolean } {
  if (previous === undefined || previous === 0) return { value: 0, positive: true };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(change)), positive: change >= 0 };
}

function getPeriodLabel(period: StatisticsPeriod): string {
  switch (period) {
    case StatisticsPeriod.DAILY:
      return 'Dag';
    case StatisticsPeriod.WEEKLY:
      return 'Vecka';
    case StatisticsPeriod.MONTHLY:
      return 'Månad';
    case StatisticsPeriod.YEARLY:
      return 'År';
  }
}

function formatGoalStatus(status: GoalStatus): string {
  switch (status) {
    case GoalStatus.NOT_STARTED:
      return 'Ej startad';
    case GoalStatus.IN_PROGRESS:
      return 'Pågående';
    case GoalStatus.COMPLETED:
      return 'Avslutad';
    case GoalStatus.CANCELLED:
      return 'Avbruten';
    default:
      return status;
  }
}

function getCategoryColor(category: keyof typeof ActivityCategories, theme: any): string {
  const colors = {
    MEMBER: theme.colors.primary,
    GOAL: theme.colors.secondary,
    ACHIEVEMENT: theme.colors.tertiary,
    COMMUNICATION: theme.colors.error,
    SETTINGS: theme.colors.onSurface
  };
  
  return colors[category] || theme.colors.primary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  comparisonButton: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeText: {
    fontSize: 12,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeIndicator: {
    marginLeft: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressFillPrevious: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0.5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  lastUpdated: {
    alignItems: 'center',
    marginVertical: 16,
  },
}); 