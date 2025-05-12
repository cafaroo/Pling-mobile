import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { UpgradeGuide } from './UpgradeGuide';
import { PaymentProcessor } from './PaymentProcessor';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

interface SubscriptionUpgradeFlowProps {
  visible: boolean;
  onClose: () => void;
  organizationId: string;
  currentPlanId: string;
  limitedResources: any[];
  onUpgradeComplete?: () => void;
}

export const SubscriptionUpgradeFlow: React.FC<SubscriptionUpgradeFlowProps> = ({
  visible,
  onClose,
  organizationId,
  currentPlanId,
  limitedResources,
  onUpgradeComplete,
}) => {
  const [step, setStep] = useState<'guide' | 'payment' | 'confirmation'>('guide');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Återställ flödet när komponenten visas
  useEffect(() => {
    if (visible) {
      setStep('guide');
      setSelectedPlanId(null);
    }
  }, [visible]);

  // Hantera val av plan från guiden
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStep('payment');
  };

  // Hantera avbryt av uppgradering
  const handleCancel = () => {
    if (step === 'payment') {
      // Fråga användaren om de verkligen vill avbryta betalningen
      Alert.alert(
        'Avbryt uppgradering',
        'Är du säker på att du vill avbryta uppgraderingen?',
        [
          { text: 'Fortsätt betalning', style: 'cancel' },
          { 
            text: 'Avbryt', 
            onPress: () => {
              setStep('guide');
              setSelectedPlanId(null);
            },
            style: 'destructive'
          },
        ]
      );
    } else {
      onClose();
    }
  };

  // Hantera slutförande av betalning
  const handlePaymentSuccess = () => {
    // Notifiera om slutförd uppgradering
    if (onUpgradeComplete) {
      onUpgradeComplete();
    }
    
    // Stäng flödet
    onClose();
  };

  // Visa rätt steg baserat på nuvarande steg
  const renderCurrentStep = () => {
    switch (step) {
      case 'guide':
        return (
          <UpgradeGuide
            visible={visible}
            onClose={onClose}
            onUpgrade={handleSelectPlan}
            organizationId={organizationId}
            currentPlanId={currentPlanId}
            limitedResources={limitedResources}
            upgradeRecommendation="Baserat på din användning rekommenderar vi att uppgradera till Pling Pro för att få tillgång till fler resurser och funktioner."
          />
        );
      case 'payment':
        return selectedPlanId ? (
          <PaymentProcessor
            organizationId={organizationId}
            selectedPlanId={selectedPlanId}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
        ) : null;
      default:
        return null;
    }
  };

  if (!visible) return null;

  return <View style={styles.container}>{renderCurrentStep()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 