import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { PlanTier, getTierDisplayName } from '../../domain/subscription/value-objects/PlanTypes';
import { formatCurrency } from '../../domain/subscription/value-objects/SubscriptionTypes';

interface SubscriptionPlanCardProps {
  tier: PlanTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: string[];
  isCurrentPlan?: boolean;
  savingsPercentage?: number;
  onSelect: () => void;
  yearlyBilling?: boolean;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  tier,
  name,
  description,
  price,
  features,
  isCurrentPlan = false,
  savingsPercentage,
  onSelect,
  yearlyBilling = false,
}) => {
  const priceDisplay = yearlyBilling ? price.yearly : price.monthly;
  const period = yearlyBilling ? '/år' : '/månad';
  
  return (
    <View style={[
      styles.container,
      isCurrentPlan && styles.currentPlanContainer,
      tier === 'enterprise' && styles.enterpriseContainer,
      tier === 'pro' && styles.proContainer,
    ]}>
      {isCurrentPlan && (
        <View style={styles.currentPlanBadge}>
          <Text style={styles.currentPlanBadgeText}>Nuvarande plan</Text>
        </View>
      )}
      
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          {formatCurrency(priceDisplay, price.currency)}
          <Text style={styles.period}>{period}</Text>
        </Text>
        
        {savingsPercentage && savingsPercentage > 0 && yearlyBilling && (
          <Text style={styles.savings}>Spara {savingsPercentage}% med årlig betalning</Text>
        )}
      </View>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.button,
          isCurrentPlan && styles.currentPlanButton,
          tier === 'enterprise' && styles.enterpriseButton,
          tier === 'pro' && styles.proButton,
        ]} 
        onPress={onSelect}
        disabled={isCurrentPlan}
      >
        <Text style={[
          styles.buttonText,
          isCurrentPlan && styles.currentPlanButtonText
        ]}>
          {isCurrentPlan ? 'Nuvarande plan' : 'Välj plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const getColorForTier = (tier: PlanTier): string => {
  switch (tier) {
    case 'basic':
      return '#3498db'; // Blå
    case 'pro':
      return '#9b59b6'; // Lila
    case 'enterprise':
      return '#2c3e50'; // Mörkblå
    default:
      return '#3498db';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    maxWidth: 340,
    position: 'relative',
  },
  currentPlanContainer: {
    borderColor: '#27ae60',
    borderWidth: 2,
  },
  proContainer: {
    borderColor: '#9b59b6',
    borderWidth: 1,
  },
  enterpriseContainer: {
    borderColor: '#2c3e50',
    borderWidth: 1,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#27ae60',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  currentPlanBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  savings: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 5,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 14,
    color: '#27ae60',
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  proButton: {
    backgroundColor: '#9b59b6',
  },
  enterpriseButton: {
    backgroundColor: '#2c3e50',
  },
  currentPlanButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanButtonText: {
    color: '#666',
  },
}); 