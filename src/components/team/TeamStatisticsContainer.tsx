import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { UniqueId } from '@/domain/core/UniqueId';
import { StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';
import { useTeamStatistics } from '@/application/team/hooks/useTeamStatistics';
import { TeamStatisticsCard } from './TeamStatisticsCard';

interface TeamStatisticsContainerProps {
  teamId: UniqueId;
  initialPeriod?: StatisticsPeriod;
}

export function TeamStatisticsContainer({
  teamId,
  initialPeriod = StatisticsPeriod.WEEKLY
}: TeamStatisticsContainerProps) {
  const [period, setPeriod] = useState(initialPeriod);
  
  const {
    data: statistics,
    isLoading,
    isError,
    error,
    prefetchOtherPeriods
  } = useTeamStatistics(teamId, period);

  const handlePeriodChange = (newPeriod: StatisticsPeriod) => {
    setPeriod(newPeriod);
  };

  // Prefetcha data för andra perioder när komponenten mountas
  React.useEffect(() => {
    prefetchOtherPeriods();
  }, [prefetchOtherPeriods]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Kunde inte ladda statistik: {error}
        </Text>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge">
          Ingen statistik tillgänglig
        </Text>
      </View>
    );
  }

  return (
    <TeamStatisticsCard
      statistics={statistics}
      onPeriodChange={handlePeriodChange}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
}); 