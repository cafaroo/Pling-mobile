import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface Reaction {
  emoji: string;
  userIds: string[];
}

interface MessageReactionsBarProps {
  reactions: Reaction[];
  onReactionPress: (emoji: string) => void;
  currentUserId: string;
}

export function MessageReactionsBar({
  reactions,
  onReactionPress,
  currentUserId
}: MessageReactionsBarProps) {
  const theme = useTheme();
  
  if (!reactions || reactions.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      {reactions.map(reaction => {
        const hasReacted = reaction.userIds.includes(currentUserId);
        
        return (
          <TouchableOpacity
            key={reaction.emoji}
            style={[
              styles.reactionBubble,
              hasReacted && { 
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary 
              }
            ]}
            onPress={() => onReactionPress(reaction.emoji)}
          >
            <Text style={styles.emoji}>{reaction.emoji}</Text>
            <Text style={[
              styles.count,
              hasReacted && { color: theme.colors.primary }
            ]}>
              {reaction.userIds.length}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 40,
    marginTop: 8
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4
  },
  emoji: {
    fontSize: 14,
    marginRight: 4
  },
  count: {
    fontSize: 12,
    fontWeight: 'bold'
  }
}); 