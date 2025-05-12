import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { useSubscription } from './SubscriptionProvider';
import { formatCurrency } from '../../domain/subscription/value-objects/SubscriptionTypes';

interface SubscriptionInfoCardProps {
  onManageSubscription?: () => void;
  onUpgrade?: () => void;
}

export const SubscriptionInfoCard: React.FC<SubscriptionInfoCardProps> = ({
  onManageSubscription,
  onUpgrade,
}) => {
  const { 
    currentPlanName, 
    hasActiveSubscription, 
    subscriptionStatus, 
    loadingSubscription 
  } = useSubscription();
  
  if (loadingSubscription) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Hämtar prenumerationsinformation...</Text>
      </View>
    );
  }
  
  if (!hasActiveSubscription) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Grundversion (Kostnadsfri)</Text>
          {onUpgrade && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>Uppgradera</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.description}>
          Du använder för närvarande den kostnadsfria versionen av Pling. 
          Uppgradera för att få tillgång till fler funktioner och högre användningsgränser.
        </Text>
        
        <View style={styles.featuresRow}>
          <Text style={styles.featureText}>• Upp till 3 teammedlemmar</Text>
          <Text style={styles.featureText}>• 100MB medialagring</Text>
          <Text style={styles.featureText}>• Grundläggande funktioner</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{subscriptionStatus?.displayName || 'Pling Premium'}</Text>
        {subscriptionStatus?.status && (
          <SubscriptionStatusBadge 
            status={subscriptionStatus.status as any}
            daysLeft={
              subscriptionStatus.isInTrial 
                ? subscriptionStatus.daysLeftInTrial 
                : subscriptionStatus.daysUntilRenewal
            }
          />
        )}
      </View>
      
      {subscriptionStatus?.isCanceled && subscriptionStatus.cancelAtPeriodEnd && (
        <View style={styles.cancelledInfo}>
          <Text style={styles.cancelledText}>
            Din prenumeration är avslutad och kommer att upphöra 
            {subscriptionStatus.daysUntilRenewal 
              ? ` om ${subscriptionStatus.daysUntilRenewal} ${subscriptionStatus.daysUntilRenewal === 1 ? 'dag' : 'dagar'}`
              : ` snart`
            }.
          </Text>
        </View>
      )}
      
      {onManageSubscription && (
        <TouchableOpacity 
          style={styles.manageButton} 
          onPress={onManageSubscription}
        >
          <Text style={styles.manageButtonText}>Hantera prenumeration</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  featuresRow: {
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  manageButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginTop: 10,
  },
  manageButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  cancelledInfo: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cancelledText: {
    fontSize: 14,
    color: '#FF8F00',
  },
}); 