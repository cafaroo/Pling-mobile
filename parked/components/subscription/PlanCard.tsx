import { View, Text, StyleSheet } from 'react-native';
import { Crown, CircleCheck as Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { SubscriptionTier, TIER_LIMITS } from '@/types/subscription';
import Button from '@/components/ui/Button';

type PlanCardProps = {
  tier: SubscriptionTier;
  isCurrentPlan?: boolean;
  onSelect: () => void;
  style?: object;
};

const TIER_PRICES = {
  free: 'Free',
  pro: '29€/month',
  business: '79€/month',
  enterprise: 'Custom',
};

export default function PlanCard({ tier, isCurrentPlan, onSelect, style }: PlanCardProps) {
  const { colors } = useTheme();
  const limits = TIER_LIMITS[tier];

  return (
    <View style={[
      styles.container,
      isCurrentPlan && { borderColor: colors.accent.yellow, borderWidth: 2 },
      style
    ]}>
      <View style={styles.header}>
        <Crown
          size={24}
          color={isCurrentPlan ? colors.accent.yellow : colors.neutral[400]}
        />
        <Text style={[styles.tierName, { color: colors.text.main }]}>
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </Text>
        <Text style={[styles.price, { color: colors.accent.yellow }]}>
          {TIER_PRICES[tier]}
        </Text>
      </View>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <Check size={20} color={colors.success} />
          <Text style={[styles.featureText, { color: colors.text.light }]}>
            {limits.maxTeamMembers === -1 
              ? 'Unlimited team members'
              : `Up to ${limits.maxTeamMembers} team members`}
          </Text>
        </View>

        <View style={styles.featureRow}>
          <Check size={20} color={colors.success} />
          <Text style={[styles.featureText, { color: colors.text.light }]}>
            {limits.maxSalesPerMonth === -1
              ? 'Unlimited sales entries'
              : `${limits.maxSalesPerMonth} sales per month`}
          </Text>
        </View>

        {limits.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Check size={20} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.text.light }]}>
              {feature.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title={isCurrentPlan ? "Current Plan" : `Upgrade to ${tier}`}
        variant={isCurrentPlan ? "outline" : "primary"}
        size="large"
        icon={Crown}
        onPress={onSelect}
        disabled={isCurrentPlan}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tierName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginVertical: 8,
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
  },
  features: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 12,
  },
  button: {
    width: '100%',
  },
});