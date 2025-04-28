import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface PlingModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PlingModal({ visible, onClose }: PlingModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background.main }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              Registrera försäljning
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text.light} size={24} />
            </TouchableOpacity>
          </View>

          {/* Placeholder content - to be implemented */}
          <View style={styles.content}>
            <Text style={[styles.placeholder, { color: colors.text.light }]}>
              Försäljningsformulär kommer snart...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});