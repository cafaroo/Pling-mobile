import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useResourceLimits, ResourceType } from './ResourceLimitProvider';
import { colors } from '@/constants/colors';

interface ResourceUsageDisplayProps {
  organizationId: string;
  resourceType: ResourceType;
  showPercentage?: boolean;
  showLabel?: boolean;
  compact?: boolean;
}

export const ResourceUsageDisplay: React.FC<ResourceUsageDisplayProps> = ({
  organizationId,
  resourceType,
  showPercentage = true,
  showLabel = true,
  compact = false,
}) => {
  const { limits, isLoading, error, refreshLimits } = useResourceLimits();
  const [percentage, setPercentage] = useState<number>(0);

  // Hitta relevant resursbegränsning
  const resourceLimit = limits.find(l => l.resourceType === resourceType);

  useEffect(() => {
    if (resourceLimit) {
      const calculatedPercentage = Math.min(
        100,
        Math.round((resourceLimit.currentUsage / resourceLimit.limitValue) * 100)
      );
      setPercentage(calculatedPercentage);
    }
  }, [resourceLimit]);

  const getStatusColor = (percent: number): string => {
    if (percent >= 100) return colors.danger;
    if (percent >= 80) return colors.warning;
    return colors.success;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !resourceLimit) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Text style={styles.errorText}>
          {error ? 'Fel vid laddning' : 'Resurs ej tillgänglig'}
        </Text>
      </View>
    );
  }

  const statusColor = getStatusColor(percentage);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showLabel && (
        <Text style={styles.label}>{resourceLimit.displayName}</Text>
      )}
      
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${percentage}%`,
              backgroundColor: statusColor 
            }
          ]} 
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.usageText}>
          {resourceLimit.currentUsage} / {resourceLimit.limitValue}
        </Text>
        
        {showPercentage && (
          <Text style={[styles.percentageText, { color: statusColor }]}>
            {percentage}%
          </Text>
        )}
      </View>
      
      {!compact && resourceLimit.description && (
        <Text style={styles.description}>{resourceLimit.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    marginBottom: 8,
  },
  containerCompact: {
    padding: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
}); 