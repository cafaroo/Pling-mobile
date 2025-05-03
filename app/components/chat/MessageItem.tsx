import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MessageSquare, Heart } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatRelativeTime } from '@/utils/dateUtils';
import type { Message } from '@/types/chat';

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

type MessageWithReactions = Message & {
  reactions: MessageReaction[];
};

interface MessageItemProps {
  message: MessageWithReactions;
  onThreadPress?: (message: MessageWithReactions) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  renderContent?: (content: string, mentions?: { id: string; name: string }[]) => React.ReactNode;
  currentUserId?: string;
  isThread?: boolean;
  showReplies?: boolean;
}

export default function MessageItem({ 
  message, 
  onThreadPress, 
  onReaction,
  renderContent,
  currentUserId,
  isThread = false,
  showReplies = true 
}: MessageItemProps) {
  const { colors } = useTheme();

  const getReactionCount = (emoji: string): number => {
    if (!Array.isArray(message.reactions)) return 0;
    return message.reactions.filter(reaction => reaction.emoji === emoji).length;
  };

  const hasReacted = (emoji: string): boolean => {
    if (!Array.isArray(message.reactions) || !currentUserId) return false;
    return message.reactions.some(reaction => 
      reaction.emoji === emoji && reaction.user_id === currentUserId
    );
  };

  const messageContent = message.content || '';
  const createdAt = message.created_at || new Date().toISOString();
  const userName = message?.user?.name || 'Okänd användare';
  const avatarUrl = message?.user?.avatar_url || 'https://via.placeholder.com/40';

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[900] }]}>
      <View style={styles.header}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
        <View style={styles.headerContent}>
          <Text style={[styles.userName, { color: colors.text.light }]}>
            {userName}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text.light }]}>
            {formatRelativeTime(createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {renderContent ? (
          renderContent(messageContent, message.mentions)
        ) : (
          <Text style={[styles.messageText, { color: colors.text.main }]}>
            {messageContent}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        {onThreadPress && (
          <TouchableOpacity
            style={styles.threadButton}
            onPress={() => onThreadPress(message)}
          >
            <MessageSquare size={16} color={colors.text.light} />
            <Text style={[styles.threadCount, { color: colors.text.light }]}>
              {message.reply_count || 0}
            </Text>
          </TouchableOpacity>
        )}

        {onReaction && (
          <TouchableOpacity
            style={[
              styles.reactionButton,
              hasReacted('❤️') && { backgroundColor: colors.primary.main }
            ]}
            onPress={() => onReaction(message.id, '❤️')}
          >
            <Heart size={16} color={colors.text.light} />
            <Text style={[styles.reactionCount, { color: colors.text.light }]}>
              {getReactionCount('❤️')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
    marginTop: 2,
  },
  content: {
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  threadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  threadCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 4,
  },
  reactionCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
}); 