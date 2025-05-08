import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { TeamStatistics, StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { formatDate } from '@/utils/dateUtils';

interface TeamStatisticsCardProps {
  statistics: TeamStatistics;
  onPeriodChange?: (period: StatisticsPeriod) => void;
}

export function TeamStatisticsCard({ statistics, onPeriodChange }: TeamStatisticsCardProps) {
  const theme = useTheme();

  const activityTrendData = {
    labels: statistics.activityTrend.map(trend => 
      formatDate(trend.date, statistics.period)
    ),
    datasets: [{
      data: statistics.activityTrend.map(trend => trend.count),
      color: () => theme.colors.primary,
      strokeWidth: 2
    }]
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: () => theme.colors.primary,
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
    <Card style={styles.card}>
      <Card.Title title="Teamstatistik" />
      <Card.Content>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="titleLarge">{statistics.completedGoals}</Text>
            <Text variant="bodyMedium">Avslutade mål</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge">{statistics.activeGoals}</Text>
            <Text variant="bodyMedium">Aktiva mål</Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="titleLarge">{statistics.memberParticipation}</Text>
            <Text variant="bodyMedium">Aktiva medlemmar</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text variant="titleMedium">Målframsteg</Text>
          <Text variant="displaySmall">
            {Math.round(statistics.averageGoalProgress)}%
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${statistics.averageGoalProgress}%`,
                  backgroundColor: theme.colors.primary
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text variant="titleMedium">Aktivitetstrend</Text>
          <LineChart
            data={activityTrendData}
            width={300}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.periodSelector}>
          {Object.values(StatisticsPeriod).map(period => (
            <Card
              key={period}
              style={[
                styles.periodCard,
                period === statistics.period && {
                  backgroundColor: theme.colors.primaryContainer
                }
              ]}
              onPress={() => onPeriodChange?.(period)}
            >
              <Card.Content>
                <Text
                  variant="labelMedium"
                  style={[
                    styles.periodText,
                    period === statistics.period && {
                      color: theme.colors.onPrimaryContainer
                    }
                  ]}
                >
                  {getPeriodLabel(period)}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

function getPeriodLabel(period: StatisticsPeriod): string {
  switch (period) {
    case StatisticsPeriod.DAILY:
      return 'Daglig';
    case StatisticsPeriod.WEEKLY:
      return 'Veckovis';
    case StatisticsPeriod.MONTHLY:
      return 'Månadsvis';
    case StatisticsPeriod.YEARLY:
      return 'Årlig';
  }
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartSection: {
    marginBottom: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  periodCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  periodText: {
    textAlign: 'center',
  },
}); 