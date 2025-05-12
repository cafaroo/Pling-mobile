import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrganization } from './OrganizationProvider';
import { ResourceLimitType, SubscriptionStatus } from '@/domain/organization/interfaces/SubscriptionService';
import { theme } from '@/styles/theme';

interface OrganizationSubscriptionInfoProps {
  organizationId: string;
}

export const OrganizationSubscriptionInfo: React.FC<OrganizationSubscriptionInfoProps> = ({
  organizationId
}) => {
  const { getSubscriptionStatus, getSubscriptionManagementUrl } = useOrganization();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managementUrl, setManagementUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Hämta prenumerationsstatus
        const status = await getSubscriptionStatus(organizationId);
        setSubscriptionStatus(status);
        
        // Hämta URL för prenumerationshantering
        const url = await getSubscriptionManagementUrl(organizationId);
        setManagementUrl(url);
      } catch (err) {
        console.error('Fel vid hämtning av prenumerationsinformation:', err);
        setError('Det gick inte att hämta prenumerationsinformation');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionInfo();
  }, [organizationId, getSubscriptionStatus, getSubscriptionManagementUrl]);

  const getUsagePercentage = (current: number, max: number): number => {
    if (max <= 0) return 100;
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const renderFeatureStatus = (enabled: boolean, label: string) => {
    return (
      <View style={styles.featureItem}>
        <Ionicons
          name={enabled ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={enabled ? theme.colors.success : theme.colors.error}
        />
        <Text style={styles.featureLabel}>{label}</Text>
      </View>
    );
  };

  const renderUsageBar = (current: number, max: number, label: string) => {
    const percentage = getUsagePercentage(current, max);
    const barColor = 
      percentage < 70 ? theme.colors.success :
      percentage < 90 ? theme.colors.warning :
      theme.colors.error;

    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>{label}</Text>
          <Text style={styles.usageText}>
            {current} / {max} ({percentage}%)
          </Text>
        </View>
        <View style={styles.usageBarContainer}>
          <View 
            style={[
              styles.usageBar, 
              { width: `${percentage}%`, backgroundColor: barColor }
            ]} 
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Hämtar prenumerationsinformation...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            getSubscriptionStatus(organizationId)
              .then(status => {
                setSubscriptionStatus(status);
                setError(null);
              })
              .catch(err => {
                console.error(err);
                setError('Det gick inte att hämta prenumerationsinformation');
              })
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!subscriptionStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Ingen prenumerationsinformation tillgänglig</Text>
      </View>
    );
  }

  const { plan, currentUsage, hasActiveSubscription, isInTrial, trialEndsAt } = subscriptionStatus;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prenumerationsinformation</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: hasActiveSubscription ? theme.colors.success : theme.colors.error }
        ]}>
          <Text style={styles.statusText}>
            {hasActiveSubscription ? 'Aktiv' : 'Inaktiv'}
          </Text>
        </View>
      </View>

      {isInTrial && trialEndsAt && (
        <View style={styles.trialContainer}>
          <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
          <Text style={styles.trialText}>
            Testperiod slutar: {new Date(trialEndsAt).toLocaleDateString('sv-SE')}
          </Text>
        </View>
      )}

      {plan && (
        <View style={styles.planContainer}>
          <Text style={styles.planName}>{plan.displayName}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
          <Text style={styles.planPrice}>
            {plan.price > 0 
              ? `${plan.price} ${plan.currency}/${plan.interval === 'monthly' ? 'månad' : 'år'}`
              : 'Gratis'}
          </Text>
        </View>
      )}

      <View style={styles.usageContainer}>
        <Text style={styles.sectionTitle}>Användning</Text>
        
        {plan && (
          <>
            {renderUsageBar(
              currentUsage.resourceCount,
              plan.features.maxResources,
              'Resurser'
            )}
            
            {renderUsageBar(
              currentUsage.teamCount,
              plan.features.maxTeams,
              'Team'
            )}
            
            {renderUsageBar(
              Math.round(currentUsage.storageUsedBytes / (1024 * 1024 * 1024)),
              plan.features.maxStorageGB,
              'Lagring (GB)'
            )}
          </>
        )}
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Funktioner</Text>
        
        {plan && (
          <>
            {renderFeatureStatus(plan.features.allowAdvancedPermissions, 'Avancerade behörigheter')}
            {renderFeatureStatus(plan.features.allowIntegrations, 'Integrationer')}
            {renderFeatureStatus(plan.features.allowExport, 'Exportering')}
            {renderFeatureStatus(plan.features.prioritySupport, 'Prioriterad support')}
          </>
        )}
      </View>

      {managementUrl && (
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={() => {
            // I en webbapp skulle detta leda användaren till managementUrl
            // I en mobil app behöver vi hantera detta annorlunda, t.ex. via en WebView
            console.log('Navigera till:', managementUrl);
            // navigation.navigate('WebView', { url: managementUrl });
          }}
        >
          <Text style={styles.manageButtonText}>Hantera prenumeration</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trialText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  planContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  usageContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  usageText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  usageBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBar: {
    height: '100%',
  },
  featuresContainer: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  manageButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  manageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 