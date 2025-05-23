import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Message } from '@/types/chat';
import { Tables } from '@/types/supabase';
import { supabase } from '@services/supabaseClient';
import MessageItem from './MessageItem';
import { Button } from '@/components/ui/Button';
import { MentionPicker } from './MentionPicker';

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

type TeamMemberWithProfile = Tables<'team_members'> & {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
};

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
  inputWrapper: {
    flex: 1,
    position: 'relative',
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  mentionPickerContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    zIndex: 1000,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

interface ThreadViewProps {
  parentMessage: MessageWithReactions;
  onClose: () => void;
  onSendReply: (content: string, threadId: string, parentId: string) => Promise<void>;
  teamId: string;
}

export default function ThreadView({ parentMessage, onClose, onSendReply, teamId }: ThreadViewProps) {
  const { colors } = useTheme();
  const { user } = useUser();
  const [replies, setReplies] = useState<MessageWithReactions[]>([]);
  const [newReply, setNewReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReplies();
    loadTeamMembers();
    const cleanup = subscribeToReplies();
    return () => {
      cleanup();
    };
  }, [parentMessage.id]);

  const loadReplies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Hämta svar
      const { data: replies, error: repliesError } = await supabase
        .from('team_messages')
        .select(`
          *,
          profiles (
            id,
            name,
            avatar_url
          )
        `)
        .eq('parent_id', parentMessage.id)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Hämta reaktioner för alla svar
      const replyIds = replies.map(reply => reply.id);
      const { data: reactions, error: reactionsError } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', replyIds);

      if (reactionsError) throw reactionsError;

      // Kombinera svar med reaktioner
      const enrichedReplies: MessageWithReactions[] = (replies || []).map(reply => ({
        ...reply,
        reactions: reactions?.filter(r => r.message_id === reply.id) || [],
        user: {
          name: reply.profiles?.name || 'Okänd användare',
          avatar_url: reply.profiles?.avatar_url
        }
      }));

      setReplies(enrichedReplies);
      setIsLoading(false);

      // Scroll to bottom after loading replies
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading replies:', error);
      setIsLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:profiles (*)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const subscribeToReplies = () => {
    const subscription = supabase
      .channel('team_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `parent_id=eq.${parentMessage.id}`
        },
        async (payload) => {
          const newReply = payload.new as Message;
          
          try {
            // Hämta användarinformation
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', newReply.user_id)
              .single();

            if (userError) throw userError;

            // Hämta eventuella reaktioner
            const { data: reactions, error: reactionsError } = await supabase
              .from('message_reactions')
              .select('*')
              .eq('message_id', newReply.id);

            if (reactionsError) throw reactionsError;

            const fullMessage: MessageWithReactions = {
              ...newReply,
              user: {
                name: userData.name || 'Okänd användare',
                avatar_url: userData.avatar_url || ''
              },
              attachments: [],
              reactions: reactions || []
            };
            
            setReplies(prevReplies => [...prevReplies, fullMessage]);
          } catch (error) {
            console.error('Error handling new reply:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !user?.id) return;

    const replyContent = newReply.trim();
    setNewReply('');

    if (!teamId) {
      console.error('No team ID found');
      return;
    }

    try {
      // Extract mentions from reply content
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      const mentions = [];
      while ((match = mentionRegex.exec(replyContent)) !== null) {
        mentions.push({
          name: match[1],
          id: match[2]
        });
      }

      const { data: message, error } = await supabase
        .from('team_messages')
        .insert({
          content: replyContent,
          thread_id: parentMessage.id,
          parent_id: parentMessage.id,
          user_id: user.id,
          team_id: teamId,
          mentions: mentions
        })
        .select(`
          *,
          user:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setNewReply(replyContent);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      const { data: existingReaction } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existingReaction) {
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error('Error deleting reaction:', deleteError);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji: emoji,
            team_id: teamId
          });

        if (insertError) {
          console.error('Error adding reaction:', insertError);
          return;
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const renderContent = (content: string, mentions?: { id: string; name: string }[]) => {
    if (!content) return null;

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={{ color: colors.text.main }}>
            {content.substring(lastIndex, match.index)}
          </Text>
        );
      }

      parts.push(
        <Text
          key={`mention-${match.index}`}
          style={{
            color: colors.primary.main,
            fontWeight: 'bold',
          }}
        >
          @{match[1]}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <Text key="text-end" style={{ color: colors.text.main }}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return <Text>{parts}</Text>;
  };

  const handleTextChange = (text: string) => {
    setNewReply(text);
    
    // Check for @ symbol
    const lastAtSymbol = text.lastIndexOf('@');
    console.log('Text changed:', text, 'Last @ symbol at:', lastAtSymbol, 'Current mentionStartIndex:', mentionStartIndex);
    
    if (lastAtSymbol !== -1) {
      const searchQuery = text.slice(lastAtSymbol + 1);
      console.log('Setting mention picker visible with query:', searchQuery);
      setMentionSearchQuery(searchQuery);
      setShowMentionPicker(true);
      setMentionStartIndex(lastAtSymbol);
    } else if (mentionStartIndex !== -1 && text.length < mentionStartIndex) {
      console.log('Hiding mention picker');
      setShowMentionPicker(false);
      setMentionStartIndex(-1);
      setMentionSearchQuery('');
    }
  };

  const handleMentionSelect = (member: { id: string; name: string; role: string }) => {
    const beforeMention = newReply.slice(0, mentionStartIndex);
    const afterMention = newReply.slice(mentionStartIndex + mentionSearchQuery.length + 1);
    const newText = `${beforeMention}@[${member.name}](${member.id})${afterMention}`;
    
    setNewReply(newText);
    setShowMentionPicker(false);
    setMentionStartIndex(-1);
    setMentionSearchQuery('');
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
              renderContent={renderContent}
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
                  renderContent={renderContent}
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
            <View style={styles.inputWrapper}>
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
                onChangeText={handleTextChange}
                placeholder="Skriv ett svar..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={1}
                maxLength={1000}
                returnKeyType="default"
                blurOnSubmit={false}
              />

              {showMentionPicker && (
                <View style={styles.mentionPickerContainer}>
                  <MentionPicker
                    members={teamMembers}
                    searchQuery={mentionSearchQuery}
                    onSelect={handleMentionSelect}
                    loading={isLoading}
                    onSelectMember={(member) => {
                      handleMentionSelect({
                        id: member.user_id,
                        name: member.profiles?.name || 'Okänd användare',
                        role: member.role
                      });
                    }}
                  />
                </View>
              )}
            </View>

            <Button
              Icon={Send}
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