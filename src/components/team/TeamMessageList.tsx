import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { TeamMessageData } from '@/application/team/hooks/useTeamMessages';
import { useAuth } from '@context/AuthContext';
import { TeamMessageItem } from './TeamMessageItem';
import { EmptyState } from '../common/EmptyState';

interface TeamMessageListProps {
  teamId: string;
  messages: TeamMessageData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasMoreMessages: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReactToMessage: (messageId: string, emoji: string, add: boolean) => void;
}

export function TeamMessageList({
  teamId,
  messages,
  isLoading,
  isError,
  error,
  hasMoreMessages,
  loadingMore,
  loadMore,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage
}: TeamMessageListProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  // När nya meddelanden kommer, scrolla till toppen om det är första meddelandet
  useEffect(() => {
    if (messages.length === 1 && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length]);
  
  // Rendera ett meddelande
  const renderItem = useCallback(({ item }: { item: TeamMessageData }) => {
    return (
      <TeamMessageItem
        message={item}
        isCurrentUser={item.senderId === user?.id}
        onEdit={content => onEditMessage(item.id, content)}
        onDelete={() => onDeleteMessage(item.id)}
        onReact={(emoji, add) => onReactToMessage(item.id, emoji, add)}
        teamId={teamId}
      />
    );
  }, [onDeleteMessage, onEditMessage, onReactToMessage, teamId, user?.id]);
  
  // Rendera laddningsindikator i botten
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.footerText}>Laddar fler meddelanden...</Text>
      </View>
    );
  }, [loadingMore, theme.colors.primary]);
  
  // Visar tom vy eller laddningsindikator om det inte finns några meddelanden
  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (isError && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Ett fel uppstod: {error?.message || 'Kunde inte ladda meddelanden'}
        </Text>
      </View>
    );
  }
  
  if (messages.length === 0) {
    return (
      <EmptyState
        icon="message-outline"
        title="Inga meddelanden"
        message="Starta en konversation genom att skicka ett meddelande nedan."
      />
    );
  }
  
  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      onEndReached={hasMoreMessages ? loadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      inverted
      contentContainerStyle={styles.list}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    textAlign: 'center',
    marginHorizontal: 20,
    color: 'red'
  },
  footer: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    marginLeft: 8
  }
}); 