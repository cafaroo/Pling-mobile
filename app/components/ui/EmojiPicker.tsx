import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { SmilePlus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface EmojiPickerProps {
  onEmojiSelected: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '👍', '❤️', '😊', '😂', '🎉', '👏', '🙌', '💪',
  '🔥', '✨', '💯', '🌟', '👌', '🤝', '💡', '⭐'
];

export default function EmojiPicker({ onEmojiSelected }: EmojiPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { colors } = useTheme();

  const handleEmojiPress = (emoji: string) => {
    onEmojiSelected(emoji);
    setIsVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={[styles.pickerButton, { backgroundColor: colors.primary.main }]}
      >
        <SmilePlus size={16} color={colors.text.light} />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View 
            style={[
              styles.emojiContainer,
              { 
                backgroundColor: colors.background.main,
                borderColor: colors.neutral[200],
              }
            ]}
          >
            <Text style={[styles.title, { color: colors.text.main }]}>
              Reaktioner
            </Text>
            <ScrollView contentContainerStyle={styles.emojiGrid}>
              {COMMON_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    { backgroundColor: colors.neutral[100] }
                  ]}
                  onPress={() => handleEmojiPress(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    padding: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emojiContainer: {
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)' }
      : Platform.OS === 'android'
      ? { elevation: 5 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }),
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emoji: {
    fontSize: 24,
  },
}); 