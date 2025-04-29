import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MessageCircle, SmilePlus } from 'lucide-react-native';
import { Message } from '../../types/chat';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTheme } from '@/context/ThemeContext';
import EmojiPicker from '@/components/ui/EmojiPicker';

interface MessageItemProps {
  message: Message;
  onThreadPress?: (message: Message) => void;
  onReaction: (messageId: string, emoji: string) => void;
  isThread?: boolean;
  showReplies?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  onThreadPress,
  onReaction,
  isThread = false,
  showReplies = true
}) => {
  const { colors } = useTheme();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionPress = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const handleThreadPress = () => {
    if (!message.parent_id && onThreadPress) {
      onThreadPress(message);
    }
  };

  const formattedDate = format(new Date(message.created_at), 'HH:mm d MMM', { locale: sv });

  return (
    <View style={[
      styles.container,
      message.parent_id && styles.replyContainer
    ]}>
      <View style={styles.messageHeader}>
        <Image 
          source={{ 
            uri: message.user.avatar_url || 'https://via.placeholder.com/40'
          }} 
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.username, { color: colors.text.main }]}>
            {message.user.username}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text.light }]}>
            {formattedDate}
          </Text>
        </View>
      </View>

      <View style={styles.messageBody}>
        <View style={[
          styles.messageBubble,
          { backgroundColor: colors.primary.light }
        ]}>
          <Text style={[styles.messageText, { color: colors.text.main }]}>
            {message.content}
          </Text>

          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <View style={[
              styles.reactionsContainer,
              { backgroundColor: colors.background.main }
            ]}>
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionBubble,
                    { backgroundColor: colors.neutral[100] }
                  ]}
                  onPress={() => handleReactionPress(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={[styles.reactionCount, { color: colors.text.light }]}>
                    {users.length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.messageActions}>
          {showReplies && !message.parent_id && (
            <TouchableOpacity 
              onPress={handleThreadPress}
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary.main }
              ]}
            >
              <MessageCircle size={16} color={colors.text.light} />
              <Text style={[styles.actionText, { color: colors.text.light }]}>
                {message.reply_count > 0 ? `${message.reply_count} svar` : 'Svara'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => setShowEmojiPicker(true)}
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary.main }
            ]}
          >
            <SmilePlus size={16} color={colors.text.light} />
            <Text style={[styles.actionText, { color: colors.text.light }]}>
              Reagera
            </Text>
          </TouchableOpacity>

          {showEmojiPicker && (
            <EmojiPicker 
              onEmojiSelected={handleReactionPress}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  replyContainer: {
    marginLeft: 32,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  messageBody: {
    marginLeft: 48,
  },
  messageBubble: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    maxWidth: '90%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    padding: 4,
    borderRadius: 12,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    opacity: 0.8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
}); 