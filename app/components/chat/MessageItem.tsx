import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { MessageSquare, Smile } from 'lucide-react-native';
import { Message } from '@/types/chat';

type MessageItemProps = {
  message: Message;
  onThreadPress: (message: Message) => void;
  onReaction: (messageId: string, emoji: string) => void;
  renderContent: (content: string, mentions?: { id: string; name: string }[]) => React.ReactNode;
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onThreadPress,
  onReaction,
  renderContent,
}) => {
  const { colors } = useTheme();
  const { user } = useUser();
  const isOwnMessage = message.user_id === user?.id;

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!isOwnMessage && (
        <View style={styles.avatarContainer}>
          {message.user.avatar_url ? (
            <Image
              source={{ uri: message.user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.primary.light },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {message.user.name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isOwnMessage
              ? colors.accent.yellow
              : colors.primary.light,
          },
        ]}
      >
        {!isOwnMessage && (
          <Text
            style={[
              styles.messageAuthor,
              { color: isOwnMessage ? colors.text.dark : colors.text.light },
            ]}
          >
            {message.user.name}
          </Text>
        )}
        
        {message.content && renderContent(message.content, message.mentions)}
        
        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((attachment, index) => (
              <View key={index} style={styles.attachment}>
                {attachment.type === 'image' && (
                  <Image
                    source={{ uri: attachment.url }}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              { color: isOwnMessage ? colors.text.dark : colors.text.light },
            ]}
          >
            {formatTime(message.created_at)}
          </Text>

          <View style={styles.messageActions}>
            <TouchableOpacity
              onPress={() => onThreadPress(message)}
              style={styles.actionButton}
            >
              <MessageSquare size={16} color={colors.text.light} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onReaction(message.id, '👍')}
              style={styles.actionButton}
            >
              <Smile size={16} color={colors.text.light} />
            </TouchableOpacity>
          </View>
        </View>

        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {message.reactions.map((reaction, index) => (
              <View
                key={index}
                style={[
                  styles.reaction,
                  { backgroundColor: colors.neutral[800] },
                ]}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={[styles.reactionCount, { color: colors.text.light }]}>
                  {reaction.count}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    marginLeft: 'auto',
  },
  otherMessage: {
    marginRight: 'auto',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: 'white',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  messageAuthor: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  messageActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachment: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
}); 