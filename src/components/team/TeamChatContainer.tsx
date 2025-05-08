import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Searchbar, IconButton, ActivityIndicator, Text } from 'react-native-paper';
import { useAuth } from '@context/AuthContext';
import { useTeamMessages, TeamMessageData } from '@/application/team/hooks/useTeamMessages';
import { TeamMessageList } from './TeamMessageList';
import { MessageComposer } from './MessageComposer';
import { EmptyState } from '../common/EmptyState';
import { MessageAttachmentData } from '@/domain/team/entities/TeamMessage';

interface TeamChatContainerProps {
  teamId: string;
}

export function TeamChatContainer({ teamId }: TeamChatContainerProps) {
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  
  const { 
    messages, 
    isLoading,
    isError,
    error,
    loadMore,
    hasMoreMessages,
    loadingMore,
    sendMessage: sendMessageAction,
    editMessage,
    deleteMessage,
    reactToMessage,
    isSending,
    isEditing,
    isDeleting,
    isReacting,
    searchTerm,
    setSearchTerm
  } = useTeamMessages(teamId);
  
  const handleSendMessage = (content: string, attachments: MessageAttachmentData[]) => {
    if (!user?.id) return;
    
    sendMessageAction({
      teamId,
      senderId: user.id,
      content,
      attachments
    });
  };
  
  if (!user) {
    return (
      <EmptyState
        icon="account-alert"
        title="Inte inloggad"
        message="Du måste vara inloggad för att använda chatten"
      />
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {showSearch ? (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Sök i konversationen..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchbar}
            autoFocus
          />
          <IconButton
            icon="close"
            onPress={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
          />
        </View>
      ) : (
        <View style={styles.header}>
          <Text variant="titleMedium">Teamchat</Text>
          <IconButton
            icon="magnify"
            onPress={() => setShowSearch(true)}
          />
        </View>
      )}
      
      <View style={styles.messageContainer}>
        <TeamMessageList
          teamId={teamId}
          messages={messages}
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasMoreMessages={hasMoreMessages}
          loadingMore={loadingMore}
          loadMore={loadMore}
          onEditMessage={(messageId, content) => editMessage({ messageId, content })}
          onDeleteMessage={id => deleteMessage(id)}
          onReactToMessage={(messageId, emoji, add) => reactToMessage({ messageId, emoji, add })}
        />
      </View>
      
      <MessageComposer
        teamId={teamId}
        onSendMessage={handleSendMessage}
        isLoading={isSending}
      />
      
      {/* Indikator för pågående åtgärder */}
      {(isEditing || isDeleting || isReacting) && (
        <View style={styles.activityIndicator}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)'
  },
  searchbar: {
    flex: 1
  },
  messageContainer: {
    flex: 1
  },
  activityIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  }
});