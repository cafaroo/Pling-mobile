import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Users, CircleAlert as AlertCircle, Crown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/context/UserContext';
import { SubscriptionTier } from '@/types/subscription';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import PlanCard from '@/components/subscription/PlanCard';
import UsageStats from '@/components/subscription/UsageStats';

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { subscription, isLoading } = useSubscription(user?.team?.id);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');

  if (!user?.team?.id) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Subscription" icon={CreditCard} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Please join or create a team to manage subscriptions
          </Text>
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Subscription" icon={CreditCard} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading subscription details...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header title="Subscription" icon={CreditCard} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {subscription && (
          <Card style={styles.currentPlan}>
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text style={[styles.planTitle, { color: colors.text.main }]}>
                  Current Plan: {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                </Text>
                <Text style={[styles.planPeriod, { color: colors.text.light }]}>
                  Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </View>
              <Users color={colors.accent.yellow} size={24} />
            </View>

            {subscription.cancelAtPeriodEnd && (
              <View style={[styles.warningBox, { backgroundColor: colors.error }]}>
                <AlertCircle color="white" size={20} style={styles.warningIcon} />
                <Text style={styles.warningText}>
                  Your subscription will be canceled at the end of the current period
                </Text>
              </View>
            )}

            <View style={styles.usageStats}>
              <Text style={[styles.usageTitle, { color: colors.text.main }]}>
                Current Usage
              </Text>
              <UsageStats
                feature="Team Members"
                used={5}
                limit={10}
              />
              <UsageStats
                feature="Monthly Sales"
                used={42}
                limit={-1}
              />
            </View>
          </Card>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Available Plans
        </Text>

        {(['pro', 'business', 'enterprise'] as SubscriptionTier[]).map((tier) => (
          <View key={tier} style={styles.tierContainer}>
            <PlanCard
              tier={tier}
              isCurrentPlan={subscription?.tier === tier}
              onSelect={() => setSelectedTier(tier)}
            />
          </View>
        ))}

        <Text style={[styles.disclaimer, { color: colors.text.light }]}>
          * All prices are in EUR and exclude VAT. Enterprise features and pricing are available upon request.
        </Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  currentPlan: {
    marginBottom: 24,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  planPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  usageStats: {
    marginTop: 24,
  },
  usageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  tierContainer: {
    marginBottom: 16,
  },
  disclaimer: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});