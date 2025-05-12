import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSubscription } from './SubscriptionProvider';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';

interface SubscriptionLimitsIndicatorProps {
  showPercentage?: boolean;
  showDetailedInfo?: boolean;
  style?: object;
}

export const SubscriptionLimitsIndicator: React.FC<SubscriptionLimitsIndicatorProps> = ({
  showPercentage = true,
  showDetailedInfo = false,
  style = {},
}) => {
  const { usagePercentages, currentPlanName } = useSubscription();
  const { getSubscriptionLimits } = useFeatureFlags();
  const [limits, setLimits] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadLimits = async () => {
      try {
        const subscriptionLimits = await getSubscriptionLimits();
        setLimits(subscriptionLimits);
      } catch (error) {
        console.error('Fel vid hämtning av prenumerationsbegränsningar:', error);
      }
    };
    
    loadLimits();
  }, [getSubscriptionLimits]);

  const renderProgressBar = (
    label: string,
    percentage: number,
    limit: number | undefined,
    currentUsage: number | undefined
  ) => {
    const barWidth = `${Math.min(percentage, 100)}%`;
    const barColor = percentage > 90
      ? '#E53935' // Röd vid >90%
      : percentage > 75
        ? '#FB8C00' // Orange vid >75%
        : '#43A047'; // Grön vid <75%

    return (
      <View style={styles.progressContainer} key={label}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
          )}
        </View>
        
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: barWidth, backgroundColor: barColor },
            ]}
          />
        </View>
        
        {showDetailedInfo && limit !== undefined && currentUsage !== undefined && (
          <Text style={styles.detailedInfo}>
            {currentUsage} / {limit === -1 ? 'Obegränsat' : limit}
          </Text>
        )}
      </View>
    );
  };

  const getUsageInfo = (key: string) => {
    const percentage = usagePercentages[key as keyof typeof usagePercentages] || 0;
    const limit = limits[key];
    
    // Beräkna ungefärlig nuvarande användning baserat på procent och gräns
    let currentUsage;
    if (limit && limit > 0) {
      currentUsage = Math.round((percentage / 100) * limit);
    } else if (limit === -1) {
      // Obegränsad användning
      currentUsage = percentage > 0 ? Math.round(percentage) : 0;
    }
    
    return { percentage, limit, currentUsage };
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>
        Användning för {currentPlanName.charAt(0).toUpperCase() + currentPlanName.slice(1)}-plan
      </Text>
      
      {Object.entries({
        'Teammedlemmar': 'teamMembers',
        'Medialagring': 'mediaStorage',
        'Dashboards': 'customDashboards',
        'API-anrop': 'apiRequests'
      }).map(([label, key]) => {
        const { percentage, limit, currentUsage } = getUsageInfo(key);
        
        // Visa bara mätvärden som har en gräns eller användning
        if (percentage > 0 || (limit !== undefined && limit !== 0)) {
          return renderProgressBar(label, percentage, limit, currentUsage);
        }
        return null;
      }).filter(Boolean)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#333333',
  },
  percentage: {
    fontSize: 14,
    color: '#666666',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  detailedInfo: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textAlign: 'right',
  },
}); 