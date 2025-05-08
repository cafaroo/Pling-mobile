import React, { useState, memo } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Menu, Avatar, useTheme, Chip } from 'react-native-paper';
import { format, isToday, isYesterday } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TeamMessageData } from '@/application/team/hooks/useTeamMessages';
import { useTeamMember } from '@/application/team/hooks/useTeamMember';
import { MessageAttachmentView } from './MessageAttachmentView';
import { MessageReactionsBar } from './MessageReactionsBar';
import { MessageEditor } from './MessageEditor';

interface TeamMessageItemProps {
  message: TeamMessageData;
  isCurrentUser: boolean;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onReact: (emoji: string, add: boolean) => void;
  teamId: string;
  onOpenThread?: (messageId: string) => void;
  isInThreadView?: boolean;
}

export const TeamMessageItem = memo(function TeamMessageItem({
  message,
  isCurrentUser,
  onEdit,
  onDelete,
  onReact,
  teamId,
  onOpenThread,
  isInThreadView = false
}: TeamMessageItemProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { member, isLoading } = useTeamMember(teamId, message.senderId);
  
  // Formatera datum
  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return `Idag ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Igår ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'PPP', { locale: sv });
    }
  };
  
  // Om meddelandet har raderats
  if (message.isDeleted) {
    return (
      <Card 
        style={[
          styles.messageCard, 
          styles.deletedCard
        ]}
        mode="outlined"
      >
        <Card.Content>
          <Text style={styles.deletedText}>
            Meddelandet har raderats
          </Text>
        </Card.Content>
      </Card>
    );
  }
  
  // Menyfunktioner
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  
  const handleEditPress = () => {
    closeMenu();
    setIsEditing(true);
  };
  
  const handleDeletePress = () => {
    closeMenu();
    onDelete();
  };
  
  const handleReactPress = (emoji: string) => {
    const hasReacted = message.reactions.some(r => 
      r.emoji === emoji && r.userIds.includes(message.senderId)
    );
    
    onReact(emoji, !hasReacted);
    setShowEmojiPicker(false);
  };
  
  // När redigering är klar
  const handleEditComplete = (newContent: string) => {
    setIsEditing(false);
    if (newContent !== message.content) {
      onEdit(newContent);
    }
  };
  
  // Om meddelandet redigeras
  if (isEditing) {
    return (
      <MessageEditor 
        initialContent={message.content}
        onSave={handleEditComplete}
        onCancel={() => setIsEditing(false)}
      />
    );
  }
  
  return (
    <Card 
      style={[
        styles.messageCard, 
        isCurrentUser ? styles.currentUserMessage : null
      ]}
      mode="outlined"
    >
      <Card.Content style={styles.contentContainer}>
        <View style={styles.messageHeader}>
          <View style={styles.headerLeft}>
            <Avatar.Text 
              size={32} 
              label={member?.displayName?.substring(0, 2) || '??'} 
              color={theme.colors.onPrimary}
              style={{ backgroundColor: isCurrentUser ? theme.colors.primary : theme.colors.secondary }}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.senderName} variant="titleMedium">
                {isLoading ? 'Laddar...' : (member?.displayName || 'Okänd användare')}
                {isCurrentUser && ' (Du)'}
                {message.isEdited && <Text style={styles.editedText}> (redigerad)</Text>}
              </Text>
              <Text style={styles.timeText} variant="bodySmall">
                {formatMessageDate(message.createdAt)}
              </Text>
            </View>
          </View>
          
          {isCurrentUser && (
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={openMenu}
                />
              }
            >
              <Menu.Item 
                onPress={handleEditPress} 
                title="Redigera" 
                leadingIcon="pencil"
              />
              <Menu.Item 
                onPress={handleDeletePress} 
                title="Radera" 
                leadingIcon="delete"
              />
            </Menu>
          )}
        </View>
        
        {/* Meddelandeinnehåll */}
        <View style={styles.messageBody}>
          <Text style={styles.messageText}>
            {message.content}
          </Text>
          
          {/* Bilagor */}
          {message.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map((attachment, index) => (
                <MessageAttachmentView 
                  key={`${message.id}-attachment-${index}`}
                  attachment={attachment}
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Reaktioner */}
        {message.reactions.length > 0 && (
          <MessageReactionsBar 
            reactions={message.reactions}
            onReactionPress={handleReactPress}
            currentUserId={message.senderId}
          />
        )}
        
        {/* Reaktionsknapp */}
        <TouchableOpacity 
          style={styles.reactionButton}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <IconButton
            icon="emoticon-outline"
            size={16}
          />
        </TouchableOpacity>
        
        {/* Emoji-picker */}
        {showEmojiPicker && (
          <View style={styles.emojiPicker}>
            {['👍', '❤️', '🎉', '👏', '🔥', '😂'].map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleReactPress(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card.Content>
      
      {/* Threading actions - show only if not already in a thread view and onOpenThread is provided */}
      {!isInThreadView && onOpenThread && (
        <View style={styles.threadActionsContainer}>
          {message.threadReplyCount > 0 && (
            <Chip 
              icon="forum-outline"
              onPress={() => onOpenThread(message.id)}
              style={styles.threadReplyChip}
              textStyle={styles.threadReplyChipText}
            >
              {`${message.threadReplyCount} ${message.threadReplyCount === 1 ? 'svar' : 'svar'}`}
            </Chip>
          )}
          <TouchableOpacity 
            style={styles.replyInThreadButton}
            onPress={() => onOpenThread(message.id)}
          >
            <IconButton icon="reply-outline" size={18} style={styles.replyInThreadIcon} />
            <Text style={styles.replyInThreadText}>Svara i tråd</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  messageCard: {
    marginBottom: 8,
    maxWidth: '95%',
    alignSelf: 'flex-start',
    borderRadius: 12
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 120, 255, 0.05)'
  },
  contentContainer: {
    padding: 8
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerInfo: {
    marginLeft: 8,
    flex: 1
  },
  senderName: {
    fontWeight: 'bold'
  },
  editedText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
    color: 'gray'
  },
  timeText: {
    color: 'gray'
  },
  messageBody: {
    marginTop: 8
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  attachmentsContainer: {
    marginTop: 8
  },
  reactionButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: -4
  },
  emojiPicker: {
    flexDirection: 'row',
    marginTop: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8
  },
  emojiButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  emoji: {
    fontSize: 18
  },
  deletedCard: {
    backgroundColor: '#f0f0f0'
  },
  deletedText: {
    fontStyle: 'italic',
    color: '#555'
  },
  threadActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },
  threadReplyChip: {
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  threadReplyChipText: {
    fontSize: 12
  },
  replyInThreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16
  },
  replyInThreadIcon: {
    marginRight: 2,
    marginLeft: -4
  },
  replyInThreadText: {
    fontSize: 12,
    color: theme.colors.primary
  }
}); 