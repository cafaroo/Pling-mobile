import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ResourceType, ResourceLimit } from './ResourceLimitProvider';
import { ResourceUsageDisplay } from './ResourceUsageDisplay';
import { SubscriptionComparison } from './SubscriptionComparison';
import { colors } from '@/constants/colors';

interface UpgradeGuideProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: (planId: string) => void;
  organizationId: string;
  currentPlanId: string;
  limitedResources: ResourceLimit[];
  upgradeRecommendation?: string;
}

type GuideStep = 'problem' | 'solution' | 'comparison' | 'confirmation';

export const UpgradeGuide: React.FC<UpgradeGuideProps> = ({
  visible,
  onClose,
  onUpgrade,
  organizationId,
  currentPlanId,
  limitedResources,
  upgradeRecommendation,
}) => {
  const [currentStep, setCurrentStep] = useState<GuideStep>('problem');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Hantera stegbyten
  useEffect(() => {
    if (visible) {
      // Återställ steg när guiden öppnas
      setCurrentStep('problem');
      setSelectedPlanId(null);
      // Animera in innehållet
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Hantera nästa steg
  const goToNextStep = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Byt steg och animera in nya innehållet
      let nextStep: GuideStep;
      switch (currentStep) {
        case 'problem':
          nextStep = 'solution';
          break;
        case 'solution':
          nextStep = 'comparison';
          break;
        case 'comparison':
          nextStep = 'confirmation';
          break;
        default:
          nextStep = 'problem';
      }
      setCurrentStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Hantera föregående steg
  const goToPreviousStep = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Byt steg och animera in nya innehållet
      let prevStep: GuideStep;
      switch (currentStep) {
        case 'solution':
          prevStep = 'problem';
          break;
        case 'comparison':
          prevStep = 'solution';
          break;
        case 'confirmation':
          prevStep = 'comparison';
          break;
        default:
          prevStep = 'problem';
      }
      setCurrentStep(prevStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Hantera uppgradering
  const handleUpgrade = () => {
    if (onUpgrade && selectedPlanId) {
      onUpgrade(selectedPlanId);
      onClose();
    }
  };

  // Hantera val av plan
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    // Efter att en plan har valts, gå direkt till bekräftelsesteg
    goToNextStep();
  };

  // Formateringsfunktion för resursanvändningsbeskrivningar
  const getResourceDescription = (limit: ResourceLimit): string => {
    const percent = Math.round((limit.currentUsage / limit.limitValue) * 100);
    return `${limit.currentUsage} av ${limit.limitValue} ${limit.displayName.toLowerCase()} (${percent}%)`;
  };

  // Ärende visas baserat på nuvarande steg
  const renderStepContent = () => {
    switch (currentStep) {
      case 'problem':
        return (
          <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
            <Text style={styles.stepTitle}>Du närmar dig resursgränser</Text>
            <Text style={styles.stepDescription}>
              Följande resurser i din organisation närmar sig eller har överskridit sina gränser:
            </Text>

            <View style={styles.limitedResourcesContainer}>
              {limitedResources.map((resource) => (
                <ResourceUsageDisplay
                  key={`resource-${resource.resourceType}`}
                  organizationId={organizationId}
                  resourceType={resource.resourceType}
                />
              ))}
            </View>

            <Text style={styles.stepDescription}>
              För att fortsätta använda tjänsten utan begränsningar rekommenderar vi att uppgradera din prenumerationsplan.
            </Text>
          </Animated.View>
        );

      case 'solution':
        return (
          <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
            <Text style={styles.stepTitle}>Fördelar med att uppgradera</Text>
            
            {upgradeRecommendation && (
              <View style={styles.recommendationContainer}>
                <Feather name="award" size={20} color={colors.primary} />
                <Text style={styles.recommendationText}>{upgradeRecommendation}</Text>
              </View>
            )}
            
            <Text style={styles.stepDescription}>
              Genom att uppgradera din plan får du:
            </Text>
            
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Högre resursgränser</Text>
              </View>
              <View style={styles.benefitItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Tillgång till avancerade funktioner</Text>
              </View>
              <View style={styles.benefitItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Prioriterad support</Text>
              </View>
              <View style={styles.benefitItem}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>Bättre prestanda</Text>
              </View>
            </View>
            
            <Text style={styles.stepDescription}>
              På nästa sida kan du jämföra olika prenumerationsplaner och välja den som passar dig bäst.
            </Text>
          </Animated.View>
        );

      case 'comparison':
        return (
          <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
            <Text style={styles.stepTitle}>Jämför prenumerationsplaner</Text>
            <Text style={styles.stepDescription}>
              Välj en plan som passar din organisations behov:
            </Text>
            
            <View style={styles.comparisonContainer}>
              <SubscriptionComparison
                currentPlanId={currentPlanId}
                onSelectPlan={handleSelectPlan}
              />
            </View>
          </Animated.View>
        );

      case 'confirmation':
        return (
          <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
            <Text style={styles.stepTitle}>Bekräfta uppgradering</Text>
            
            <View style={styles.confirmationContainer}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <Text style={styles.confirmationText}>
                Du har valt att uppgradera din prenumeration
              </Text>
              <Text style={styles.confirmationDescription}>
                Efter uppgraderingen kommer dina resursgränser att utökas omedelbart.
                Faktureringen kommer att justeras baserat på din nuvarande betalningsperiod.
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Bekräfta uppgradering</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // Progressindikator för steg
  const renderStepIndicator = () => {
    const steps: GuideStep[] = ['problem', 'solution', 'comparison', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.stepIndicatorContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.stepDot,
                index <= currentIndex && styles.stepDotActive,
              ]}
            />
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentIndex && styles.stepLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Navigationsknappar för steg
  const renderStepNavigation = () => {
    return (
      <View style={styles.stepNavigationContainer}>
        {currentStep !== 'problem' && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToPreviousStep}
          >
            <Feather name="arrow-left" size={20} color={colors.primary} />
            <Text style={styles.navButtonText}>Föregående</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.spacer} />
        
        {currentStep !== 'confirmation' && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToNextStep}
          >
            <Text style={styles.navButtonText}>Nästa</Text>
            <Feather name="arrow-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Prenumerationsguide</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {renderStepIndicator()}
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {renderStepContent()}
          </ScrollView>
          
          {renderStepNavigation()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.lightGray,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.lightGray,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    paddingVertical: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  limitedResourcesContainer: {
    marginVertical: 16,
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10', // 10% opacity
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  benefitsContainer: {
    marginVertical: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  comparisonContainer: {
    flex: 1,
    height: 400, // Fast höjd för jämförelsevy
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  confirmationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  spacer: {
    flex: 1,
  },
}); 