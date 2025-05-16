import React, { useEffect } from 'react';
import { useUIState } from '../context/UIStateContext';
import { Modal, View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';

// Typer av dialoger som kan visas
export type DialogType = 'confirmation' | 'alert' | 'input' | 'custom';

// Gemensamma props för alla dialog-komponenter
interface BaseDialogProps {
  id: string;
  onClose: () => void;
}

// Props för confirmation dialog
interface ConfirmationDialogProps extends BaseDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  danger?: boolean;
}

// Alert dialog
interface AlertDialogProps extends BaseDialogProps {
  title: string;
  message: string;
  buttonText?: string;
}

// Input dialog
interface InputDialogProps extends BaseDialogProps {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  cancelText?: string;
  submitText?: string;
}

// Custom dialog
interface CustomDialogProps extends BaseDialogProps {
  component: React.ReactNode;
}

// Dialogtyper beroende på id prefix
const getDialogType = (id: string): DialogType => {
  if (id.startsWith('confirm-')) return 'confirmation';
  if (id.startsWith('alert-')) return 'alert';
  if (id.startsWith('input-')) return 'input';
  return 'custom';
};

// ConfirmationDialog-komponent
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  id,
  title,
  message,
  confirmText = 'Bekräfta',
  cancelText = 'Avbryt',
  onConfirm,
  onCancel,
  onClose,
  danger = false,
}) => {
  // Hantera tillbaka-knapp på Android
  useEffect(() => {
    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onClose]);

  return (
    <View style={styles.container}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              onCancel?.();
              onClose();
            }}
          >
            <Text style={styles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.confirmButton,
              danger && styles.dangerButton
            ]}
            onPress={() => {
              onConfirm?.();
              onClose();
            }}
          >
            <Text style={[
              styles.confirmButtonText,
              danger && styles.dangerButtonText
            ]}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// AlertDialog-komponent
const AlertDialog: React.FC<AlertDialogProps> = ({
  id,
  title,
  message,
  buttonText = 'OK',
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.alertButton]}
            onPress={onClose}
          >
            <Text style={styles.alertButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/**
 * Komponent som renderar dialoger baserat på UIStateContext
 */
export const DialogRenderer: React.FC = () => {
  const { state, hideModal } = useUIState();
  const { activeModals } = state.modals;

  return (
    <>
      {activeModals.map((modal) => {
        const modalId = modal.id;
        const modalProps = modal.props || {};
        const dialogType = getDialogType(modalId);

        const closeModal = () => hideModal(modalId);

        return (
          <Modal
            key={modalId}
            transparent
            animationType="fade"
            visible={true}
            onRequestClose={closeModal}
          >
            {dialogType === 'confirmation' && (
              <ConfirmationDialog
                id={modalId}
                title={modalProps.title || 'Bekräfta'}
                message={modalProps.message || ''}
                confirmText={modalProps.confirmText}
                cancelText={modalProps.cancelText}
                onConfirm={modalProps.onConfirm}
                onCancel={modalProps.onCancel}
                onClose={closeModal}
                danger={modalProps.danger}
              />
            )}

            {dialogType === 'alert' && (
              <AlertDialog
                id={modalId}
                title={modalProps.title || 'Meddelande'}
                message={modalProps.message || ''}
                buttonText={modalProps.buttonText}
                onClose={closeModal}
              />
            )}

            {dialogType === 'custom' && (
              <View style={styles.container}>
                {modalProps.component}
              </View>
            )}
          </Modal>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#2196f3',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  dangerButtonText: {
    color: 'white',
  },
  alertButton: {
    backgroundColor: '#2196f3',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 