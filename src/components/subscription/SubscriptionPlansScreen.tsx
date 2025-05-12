import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { useSubscription } from './SubscriptionProvider';
import { SubscriptionRepository } from '../../domain/subscription/repositories/SubscriptionRepository';
import { SubscriptionPlan } from '../../domain/subscription/entities/SubscriptionPlan';

interface SubscriptionPlansScreenProps {
  subscriptionRepository: SubscriptionRepository;
}

export const SubscriptionPlansScreen: React.FC<SubscriptionPlansScreenProps> = ({
  subscriptionRepository,
}) => {
  const navigation = useNavigation();
  const { currentPlanName } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [yearlyBilling, setYearlyBilling] = useState(true);
  
  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const allPlans = await subscriptionRepository.getAllSubscriptionPlans();
        setPlans(allPlans);
      } catch (error) {
        console.error('Fel vid hämtning av prenumerationsplaner:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPlans();
  }, [subscriptionRepository]);
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // @ts-ignore
    navigation.navigate('SubscriptionCheckout', {
      planId: plan.id.toString(),
      yearlyBilling,
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Hämtar prenumerationsplaner...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Våra prenumerationsplaner</Text>
      <Text style={styles.subtitle}>Välj den plan som passar ditt team bäst</Text>
      
      <View style={styles.billingToggleContainer}>
        <Text style={styles.billingText}>Månadsvis</Text>
        <Switch
          value={yearlyBilling}
          onValueChange={setYearlyBilling}
          trackColor={{ false: '#D0D0D0', true: '#9b59b6' }}
          thumbColor={yearlyBilling ? '#8e44ad' : '#f4f3f4'}
        />
        <Text style={[styles.billingText, yearlyBilling && styles.activeBillingText]}>
          Årsvis (spara upp till 20%)
        </Text>
      </View>
      
      <ScrollView style={styles.plansContainer} contentContainerStyle={styles.plansContent}>
        {plans.map((plan) => (
          <SubscriptionPlanCard
            key={plan.id.toString()}
            tier={plan.name}
            name={plan.displayName}
            description={plan.description}
            price={plan.price}
            features={plan.features.map(f => f.name)}
            isCurrentPlan={plan.name === currentPlanName}
            savingsPercentage={plan.getYearlySavingsPercentage()}
            onSelect={() => handleSelectPlan(plan)}
            yearlyBilling={yearlyBilling}
          />
        ))}
      </ScrollView>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Alla prenumerationer kan avbrytas när som helst. Vi erbjuder 14 dagars full återbetalning 
          om du inte är nöjd med din prenumeration.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  billingToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  billingText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  activeBillingText: {
    color: '#8e44ad',
    fontWeight: 'bold',
  },
  plansContainer: {
    flex: 1,
  },
  plansContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  infoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 