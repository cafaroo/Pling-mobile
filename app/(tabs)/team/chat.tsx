import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/services/supabaseClient';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  mentions: any[];
  attachments: string[];
  message_type: 'text' | 'image' | 'file' | 'system';
  user: {
    name: string;
    avatar_url: string;
  };
};

export default function TeamChatScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { markAsRead } = useUnreadMessages();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!user?.team?.id) return;

    // Load initial messages
    loadMessages();
    
    // Mark messages as read when opening chat
    markAsRead();

    // Subscribe to new messages
    const channel = supabase
      .channel('team_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${user.team.id}`,
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            mentions: payload.new.mentions || [],
            attachments: payload.new.attachments || [],
            message_type: payload.new.message_type || 'text',
            user: {
              name: 'Loading...',
              avatar_url: null,
            }
          } as Message;
          setMessages((prev) => [...prev, newMessage]);
          // Scroll to bottom on new message
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.team?.id]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select(`
          id,
          user_id,
          content,
          created_at,
          mentions,
          attachments,
          message_type,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('team_id', user?.team?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data as Message[]);
      setIsLoading(false);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.team?.id) return;

    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const { error } = await supabase
        .from('team_messages')
        .insert({
          team_id: user.team.id,
          user_id: user.id,
          content: messageToSend,
          mentions: [],
          attachments: [],
          message_type: 'text',
        });

      if (error) {
        setError('Failed to send message');
        setNewMessage(messageToSend); // Restore message on error
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            {item.user.avatar_url ? (
              <Image
                source={{ uri: item.user.avatar_url }}
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
                  {item.user.name?.charAt(0) || '?'}
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
              {item.user.name}
            </Text>
          )}
          
          {item.message_type === 'text' && (
            <Text
              style={[
                styles.messageText,
                { color: isOwnMessage ? colors.text.dark : colors.text.main },
              ]}
            >
              {item.content}
            </Text>
          )}

          {item.message_type === 'image' && (
            <Image
              source={{ uri: item.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}

          {item.message_type === 'file' && (
            <TouchableOpacity 
              style={styles.fileContainer}
              onPress={() => {/* Hantera filöppning */}}
            >
              <Text
                style={[
                  styles.fileText,
                  { color: isOwnMessage ? colors.text.dark : colors.text.main },
                ]}
              >
                📎 {item.content}
              </Text>
            </TouchableOpacity>
          )}

          {item.mentions.length > 0 && (
            <View style={styles.mentionsContainer}>
              {item.mentions.map((mention, index) => (
                <Text
                  key={index}
                  style={[
                    styles.mentionText,
                    { color: colors.accent.yellow },
                  ]}
                >
                  @{mention.name}
                </Text>
              ))}
            </View>
          )}

          {item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.attachmentItem}
                  onPress={() => {/* Hantera attachmentöppning */}}
                >
                  <Text
                    style={[
                      styles.attachmentText,
                      { color: isOwnMessage ? colors.text.dark : colors.text.main },
                    ]}
                  >
                    📎 {attachment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text
            style={[
              styles.messageTime,
              { color: isOwnMessage ? colors.text.dark : colors.text.light },
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Team Chat" 
        icon={MessageSquare}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.container}>
          {!user?.team?.id ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text.light }]}>
                You need to be part of a team to use chat
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text.light }]}>
                Loading messages...
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onLayout={() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }}
              />
              
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    onPress={() => setError(null)}
                    style={styles.errorDismiss}
                  >
                    <Text style={styles.errorDismissText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <View style={[
            styles.inputContainer,
            { borderTopColor: colors.neutral[700] }
          ]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  borderColor: colors.neutral[500],
                  color: colors.text.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                },
              ]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={1}
              maxLength={1000}
              returnKeyType="default"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (Platform.OS !== 'ios') {
                  sendMessage();
                }
              }}
            />
            <Button
              title=""
              icon={Send}
              onPress={sendMessage}
              variant="primary"
              size="medium"
              style={styles.sendButton}
              disabled={!newMessage.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  messagesList: {
    padding: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  errorText: {
    color: 'white',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    marginLeft: 12,
  },
  errorDismissText: {
    color: 'white',
    fontSize: 18,
  },
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
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    padding: 0,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileContainer: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginVertical: 4,
  },
  fileText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  mentionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  mentionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginRight: 4,
  },
  attachmentsContainer: {
    marginTop: 4,
  },
  attachmentItem: {
    padding: 4,
  },
  attachmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});