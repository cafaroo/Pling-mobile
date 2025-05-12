import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useResourceLimits, ResourceType } from './ResourceLimitProvider';
import { ResourceUsageDisplay } from './ResourceUsageDisplay';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import { ResourceUsageTrackingService } from '@/services/ResourceUsageTrackingService';

interface ResourceUsageOverviewProps {
  organizationId: string;
  title?: string;
  compact?: boolean;
  showRefreshButton?: boolean;
}

export const ResourceUsageOverview: React.FC<ResourceUsageOverviewProps> = ({
  organizationId,
  title = 'Resursanvändning',
  compact = false,
  showRefreshButton = true,
}) => {
  const { limits, isLoading, error, refreshLimits } = useResourceLimits();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<Record<ResourceType, number> | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Sortera resurser efter användningsgrad (högst först)
  const sortedLimits = [...limits].sort((a, b) => {
    const percentA = a.currentUsage / a.limitValue;
    const percentB = b.currentUsage / b.limitValue;
    return percentB - percentA;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLimits();
    await loadDashboardData();
    setRefreshing(false);
  };

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const trackingService = new ResourceUsageTrackingService(organizationId);
      const data = await trackingService.getResourcesDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Fel vid hämtning av dashboarddata:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadDashboardData();
    }
  }, [organizationId]);

  if (isLoading || dashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Laddar resursanvändning...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={24} color={colors.danger} />
        <Text style={styles.errorText}>
          Kunde inte ladda resursanvändning. Försök igen senare.
        </Text>
        {showRefreshButton && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Försök igen</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        {showRefreshButton && (
          <TouchableOpacity onPress={onRefresh}>
            <Feather name="refresh-cw" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sortedLimits.length === 0 ? (
          <Text style={styles.noResourcesText}>
            Inga resursbegränsningar hittades för denna organisation.
          </Text>
        ) : (
          sortedLimits.map((limit) => (
            <ResourceUsageDisplay
              key={`resource-${limit.resourceType}`}
              organizationId={organizationId}
              resourceType={limit.resourceType}
              showPercentage={true}
              showLabel={true}
              compact={compact}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  noResourcesText: {
    padding: 16,
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
}); 