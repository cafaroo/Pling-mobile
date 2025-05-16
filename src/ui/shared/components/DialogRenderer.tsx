import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useUIState } from '../context/UIStateContext';

/**
 * Komponent som renderar dialoger baserat på UIStateContext
 */
export const DialogRenderer: React.FC = () => {
  const { activeDialog, hideDialog } = useUIState();
  
  if (!activeDialog) {
    return null;
  }
  
  const { title, message, confirmText = 'OK', cancelText, onConfirm, onCancel, id } = activeDialog;
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    hideDialog(id);
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    hideDialog(id);
  };
  
  return (
    <Modal
      transparent
      visible={!!activeDialog}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <View style={styles.dialogHeader}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.dialogBody}>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <View style={styles.dialogFooter}>
            {cancelText && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dialogHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dialogBody: {
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
  },
}); 