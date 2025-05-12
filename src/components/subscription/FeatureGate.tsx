import React, { ReactNode, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useSubscription } from './SubscriptionProvider';

interface FeatureGateProps {
  /**
   * ID för den funktion som krävs
   */
  featureId: string;
  
  /**
   * Innehåll att visa om funktionen är tillgänglig
   */
  children: ReactNode;
  
  /**
   * Om true, visas ingenting när funktionen inte är tillgänglig
   */
  hideIfNotAvailable?: boolean;
  
  /**
   * Om true, visar en uppgraderingsknapp istället för placeholder
   */
  showUpgradeButton?: boolean;
  
  /**
   * Anpassningsbart meddelande för att visa när funktionen inte är tillgänglig
   */
  fallbackMessage?: string;
  
  /**
   * Callback för uppgraderingsknappen
   */
  onUpgradePress?: () => void;
}

/**
 * FeatureGate-komponent som villkorligt visar innehåll baserat på 
 * om användaren har åtkomst till en viss funktion.
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  children,
  hideIfNotAvailable = false,
  showUpgradeButton = false,
  fallbackMessage,
  onUpgradePress,
}) => {
  const { hasFeatureAccess } = useFeatureFlags();
  const { currentPlanName } = useSubscription();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const allowed = await hasFeatureAccess(featureId);
        setIsAllowed(allowed);
      } catch (error) {
        console.error(`Fel vid kontroll av åtkomst till funktion ${featureId}:`, error);
        setIsAllowed(false);
      }
    };
    
    checkAccess();
  }, [featureId, hasFeatureAccess]);

  // Visar en laddningsindikator medan vi kontrollerar åtkomst
  if (isAllowed === null) {
    return null;
  }

  // Om användaren har åtkomst, visa det normala innehållet
  if (isAllowed) {
    return <>{children}</>;
  }

  // Om vi ska dölja innehållet när det inte är tillgängligt
  if (hideIfNotAvailable) {
    return null;
  }

  // Visa uppgraderingsknapp med standardmeddelande
  if (showUpgradeButton) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          {fallbackMessage || `Denna funktion är endast tillgänglig i högre prenumerationsplaner.`}
        </Text>
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => {
            if (onUpgradePress) {
              onUpgradePress();
            } else {
              setShowUpgradeModal(true);
            }
          }}
        >
          <Text style={styles.upgradeButtonText}>Uppgradera din plan</Text>
        </TouchableOpacity>

        <Modal
          visible={showUpgradeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUpgradeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Uppgradera din prenumeration</Text>
              <Text style={styles.modalMessage}>
                För att använda {featureId.replace(/_/g, ' ')} behöver du uppgradera
                från {currentPlanName}-planen till en högre prenumerationsplan.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalSecondaryButton}
                  onPress={() => setShowUpgradeModal(false)}
                >
                  <Text style={styles.modalSecondaryButtonText}>Senare</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    setShowUpgradeModal(false);
                    // Här kan man implementera navigering till prenumerationssidan
                  }}
                >
                  <Text style={styles.modalPrimaryButtonText}>Visa prenumerationsplaner</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Standardfallback - visa ett meddelande
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        {fallbackMessage || `Denna funktion kräver en högre prenumerationsplan.`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  message: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#5C6BC0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalPrimaryButton: {
    backgroundColor: '#5C6BC0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSecondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  modalSecondaryButtonText: {
    color: '#5C6BC0',
  },
}); 