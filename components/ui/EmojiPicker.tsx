import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// Emoji kategorier
const EMOJI_CATEGORIES = {
  'Senaste': [], // Fylls i via props
  'Vanliga': ['👍', '❤️', '😊', '😂', '🎉', '👏', '🙌', '🔥', '✨', '💪'],
  'Ansikten': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘'],
  'Gester': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲'],
  'Hjärtan': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❤️‍🔥', '💖', '💗', '💓'],
  'Symboler': ['✨', '⭐️', '🌟', '💫', '⚡️', '🔥', '❄️', '🌈', '🎵', '🎶', '💯', '💪', '🏆', '🎉']
};

type EmojiPickerProps = {
  onEmojiSelected: (emoji: string) => void;
  recentEmojis?: string[];
};

export default function EmojiPicker({ onEmojiSelected, recentEmojis = [] }: EmojiPickerProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Vanliga');

  // Uppdatera senaste emojis
  EMOJI_CATEGORIES['Senaste'] = recentEmojis;

  // Filtrera emojis baserat på sökfrågan
  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES).flat().filter(emoji => 
        emoji.toLowerCase().includes(searchQuery.toLowerCase()))
    : EMOJI_CATEGORIES[selectedCategory];

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[800] }]}>
      {/* Sökfält */}
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.neutral[700],
            color: colors.text.main,
            borderColor: colors.neutral[600]
          }
        ]}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Sök emoji..."
        placeholderTextColor={colors.text.light}
      />

      {/* Kategoriflikar */}
      {!searchQuery && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
        >
          {Object.keys(EMOJI_CATEGORIES).map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && { 
                  backgroundColor: colors.neutral[700] 
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                { color: colors.text.light }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Emoji grid */}
      <ScrollView style={styles.emojiGrid}>
        <View style={styles.emojiContainer}>
          {filteredEmojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiButton,
                { backgroundColor: colors.neutral[700] }
              ]}
              onPress={() => onEmojiSelected(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    maxHeight: 400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchInput: {
    margin: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  categoryTabs: {
    flexGrow: 0,
    paddingHorizontal: 8,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  emojiGrid: {
    flex: 1,
    padding: 8,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emoji: {
    fontSize: 24,
  },
}); 