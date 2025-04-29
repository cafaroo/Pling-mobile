import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Message } from '../../types/chat';
import { supabase } from '@/services/supabaseClient';
import { MessageItem } from './MessageItem';
import Button from '@/components/ui/Button';

type ThreadViewProps = {
  parentMessage: Message;
  onClose: () => void;
  onSendReply: (content: string, threadId: string, parentId: string) => Promise<void>;
};

export const ThreadView: React.FC<ThreadViewProps> = ({ parentMessage, onClose, onSendReply }) => {
  const { colors } = useTheme();
  const { user } = useUser();
  const [replies, setReplies] = useState<Message[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadReplies();
    const cleanup = subscribeToReplies();
    return () => {
      cleanup();
    };
  }, [parentMessage.id]);

  const loadReplies = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('team_messages')
        .select(`
          id,
          content,
          created_at,
          user:user_id (
            id,
            name,
            avatar_url
          ),
          parent_id,
          thread_id,
          reply_count
        `)
        .eq('thread_id', parentMessage.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messageIds = messagesData.map(msg => msg.id);
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (reactionsError) throw reactionsError;

      const messagesWithReactions = messagesData.map(msg => ({
        ...msg,
        reactions: reactionsData
          ? reactionsData.filter(r => r.message_id === msg.id)
          : []
      }));

      setReplies(messagesWithReactions as Message[]);
      setIsLoading(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading replies:', error);
      setIsLoading(false);
    }
  };

  const subscribeToReplies = () => {
    const messagesChannel = supabase
      .channel('thread_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `thread_id=eq.${parentMessage.id}`,
        },
        async (payload) => {
          const { data: messageData } = await supabase
            .from('team_messages')
            .select(`
              id,
              content,
              created_at,
              user:user_id (
                id,
                name,
                avatar_url
              ),
              parent_id,
              thread_id,
              reply_count
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageData) {
            setReplies(prev => [...prev, { ...messageData, reactions: [] }]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel('thread_reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        async (payload) => {
          const messageId = payload.new?.message_id || payload.old?.message_id;
          
          const { data: reactions } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId);

          setReplies(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, reactions: reactions || [] }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
    };
  };

  const handleSendReply = async () => {
    if (!newReply.trim()) return;

    const replyContent = newReply.trim();
    setNewReply('');

    try {
      await onSendReply(replyContent, parentMessage.id, parentMessage.id);
    } catch (error) {
      console.error('Error sending reply:', error);
      setNewReply(replyContent);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existingReaction) {
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji
          });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={[styles.header, { 
        borderBottomColor: colors.neutral[700],
        backgroundColor: colors.primary.dark 
      }]}>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text.light} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.light }]}>
            Tråd
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.light }]}>
            {replies.length} {replies.length === 1 ? 'svar' : 'svar'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.content}>
          <View style={[styles.parentMessage, { backgroundColor: colors.neutral[800] }]}>
            <MessageItem 
              message={parentMessage} 
              isThread 
              showReplies={false}
              onReaction={handleReaction}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.neutral[700] }]} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <Text style={[styles.loadingText, { color: colors.text.light }]}>
                Laddar svar...
              </Text>
            </View>
          ) : replies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.light }]}>
                Inga svar än. Var först med att svara!
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={replies}
              renderItem={({ item }) => (
                <MessageItem 
                  message={item} 
                  isThread 
                  showReplies={false}
                  onReaction={handleReaction}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.repliesList}
              onLayout={() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
            />
          )}

          <View style={[
            styles.inputContainer, 
            { 
              borderTopColor: colors.neutral[700],
              backgroundColor: colors.neutral[900]
            }
          ]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  borderColor: colors.neutral[500],
                  color: colors.text.main,
                  backgroundColor: colors.neutral[800],
                },
              ]}
              value={newReply}
              onChangeText={setNewReply}
              placeholder="Skriv ett svar..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={1}
              maxLength={1000}
              returnKeyType="default"
              blurOnSubmit={false}
            />

            <Button
              title=""
              icon={Send}
              onPress={handleSendReply}
              variant="primary"
              size="medium"
              style={[
                styles.sendButton,
                !newReply.trim() && { opacity: 0.5 }
              ]}
              disabled={!newReply.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  parentMessage: {
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  repliesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});