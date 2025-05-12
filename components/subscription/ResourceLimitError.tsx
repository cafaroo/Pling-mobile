import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ResourceType } from './ResourceLimitProvider';
import { colors } from '@/constants/colors';

interface ResourceLimitErrorProps {
  visible: boolean;
  resourceType: ResourceType;
  limitValue: number;
  currentUsage: number;
  displayName: string;
  description?: string;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const ResourceLimitError: React.FC<ResourceLimitErrorProps> = ({
  visible,
  resourceType,
  limitValue,
  currentUsage,
  displayName,
  description,
  onClose,
  onUpgrade,
}) => {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerContainer}>
            <Feather name="alert-triangle" size={24} color={colors.warning} />
            <Text style={styles.headerText}>Resursgräns nådd</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.resourceName}>{displayName}</Text>
            
            <View style={styles.usageContainer}>
              <Text style={styles.usageText}>
                Aktuell användning: {currentUsage} / {limitValue}
              </Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, (currentUsage / limitValue) * 100)}%` },
                  ]}
                />
              </View>
            </View>

            {description && (
              <Text style={styles.descriptionText}>{description}</Text>
            )}

            <Text style={styles.infoText}>
              Du har nått gränsen för {displayName.toLowerCase()} i din nuvarande prenumerationsplan.
            </Text>

            <View style={styles.actionsContainer}>
              {onUpgrade && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={onUpgrade}
                >
                  <Text style={styles.upgradeButtonText}>Uppgradera plan</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Stäng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hjälpfunktion för att skapa ett standardiserat felmeddelande
export const createResourceLimitErrorProps = (
  resourceType: ResourceType,
  limitValue: number,
  currentUsage: number,
  displayName: string,
  description?: string,
): Omit<ResourceLimitErrorProps, 'visible' | 'onClose' | 'onUpgrade'> => {
  return {
    resourceType,
    limitValue,
    currentUsage,
    displayName,
    description,
  };
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
  },
  usageContainer: {
    marginBottom: 16,
  },
  usageText: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.textSecondary,
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: 4,
  },
  descriptionText: {
    marginBottom: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoText: {
    marginBottom: 20,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  upgradeButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
}); 