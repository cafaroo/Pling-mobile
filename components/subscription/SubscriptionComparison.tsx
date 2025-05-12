import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  limits: Record<string, number>;
}

interface SubscriptionComparison {
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  yearlyBilling?: boolean;
  showBillingToggle?: boolean;
}

export const SubscriptionComparison: React.FC<SubscriptionComparison> = ({
  currentPlanId,
  onSelectPlan,
  yearlyBilling: initialYearlyBilling = false,
  showBillingToggle = true,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyBilling, setYearlyBilling] = useState(initialYearlyBilling);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        throw error;
      }

      setPlans(data || []);
    } catch (err) {
      setError('Kunde inte hämta prenumerationsplaner');
      console.error('Fel vid hämtning av prenumerationsplaner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  const toggleBillingCycle = () => {
    setYearlyBilling(!yearlyBilling);
  };

  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPlanSavings = (monthlyPrice: number, yearlyPrice: number): string => {
    const monthlyCost = monthlyPrice * 12;
    const yearlyCost = yearlyPrice;
    const savings = monthlyCost - yearlyCost;
    const savingsPercent = Math.round((savings / monthlyCost) * 100);
    return `Spara ${savingsPercent}%`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Laddar prenumerationsplaner...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={24} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlans}>
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showBillingToggle && (
        <View style={styles.billingToggleContainer}>
          <Text style={styles.billingToggleLabel}>Faktureringsperiod:</Text>
          <View style={styles.billingToggleButtons}>
            <TouchableOpacity
              style={[
                styles.billingToggleButton,
                !yearlyBilling && styles.billingToggleButtonActive,
              ]}
              onPress={() => setYearlyBilling(false)}
            >
              <Text
                style={[
                  styles.billingToggleButtonText,
                  !yearlyBilling && styles.billingToggleButtonTextActive,
                ]}
              >
                Månadsvis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.billingToggleButton,
                yearlyBilling && styles.billingToggleButtonActive,
              ]}
              onPress={() => setYearlyBilling(true)}
            >
              <Text
                style={[
                  styles.billingToggleButtonText,
                  yearlyBilling && styles.billingToggleButtonTextActive,
                ]}
              >
                Årsvis
              </Text>
              {yearlyBilling && (
                <View style={styles.savingsTag}>
                  <Text style={styles.savingsTagText}>Spara upp till 25%</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.plansScrollView}
        contentContainerStyle={styles.plansContainer}
      >
        {plans.map((plan) => {
          const price = yearlyBilling ? plan.price_yearly : plan.price_monthly;
          const interval = yearlyBilling ? '/år' : '/månad';
          const isCurrentPlan = plan.id === currentPlanId;
          const savingsText = yearlyBilling
            ? getPlanSavings(plan.price_monthly, plan.price_yearly)
            : '';

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isCurrentPlan && styles.currentPlanCard,
              ]}
            >
              <View style={styles.planHeaderContainer}>
                <Text style={styles.planName}>{plan.display_name}</Text>
                {isCurrentPlan && (
                  <View style={styles.currentPlanTag}>
                    <Text style={styles.currentPlanTagText}>Nuvarande</Text>
                  </View>
                )}
              </View>

              <Text style={styles.planDescription}>{plan.description}</Text>

              <View style={styles.priceContainer}>
                <Text style={styles.priceAmount}>
                  {formatPrice(price, plan.currency)}
                  <Text style={styles.priceInterval}>{interval}</Text>
                </Text>
                {yearlyBilling && (
                  <Text style={styles.savingsText}>{savingsText}</Text>
                )}
              </View>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Inkluderade funktioner:</Text>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Feather name="check" size={16} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.limitsContainer}>
                <Text style={styles.limitsTitle}>Resursgränser:</Text>
                {Object.entries(plan.limits).map(([key, value], index) => (
                  <View key={index} style={styles.limitItem}>
                    <Text style={styles.limitName}>
                      {key === 'teamMembers'
                        ? 'Teammedlemmar'
                        : key === 'mediaStorage'
                        ? 'Medialagring'
                        : key === 'customDashboards'
                        ? 'Dashboards'
                        : key}
                    </Text>
                    <Text style={styles.limitValue}>
                      {key === 'mediaStorage'
                        ? `${value} MB`
                        : value.toString()}
                    </Text>
                  </View>
                ))}
              </View>

              {onSelectPlan && !isCurrentPlan && (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handlePlanSelect(plan.id)}
                >
                  <Text style={styles.selectButtonText}>
                    {currentPlanId ? 'Uppgradera' : 'Välj'}
                  </Text>
                </TouchableOpacity>
              )}

              {isCurrentPlan && (
                <View style={styles.currentPlanButton}>
                  <Text style={styles.currentPlanButtonText}>
                    Nuvarande plan
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  billingToggleContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  billingToggleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  billingToggleButtons: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  billingToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  billingToggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  billingToggleButtonTextActive: {
    color: colors.white,
  },
  savingsTag: {
    position: 'absolute',
    top: -8,
    right: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savingsTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  plansScrollView: {
    flex: 1,
  },
  plansContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  planCard: {
    width: 280,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  planHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  currentPlanTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentPlanTagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  priceInterval: {
    fontSize: 16,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  savingsText: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  limitsContainer: {
    marginBottom: 20,
  },
  limitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitName: {
    fontSize: 14,
    color: colors.text,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  currentPlanButton: {
    backgroundColor: colors.lightGray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentPlanButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
}); 