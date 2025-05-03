import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Send, Image as ImageIcon, X, Paperclip, FileText, Download, Smile, Bold, Italic, List, Link as LinkIcon } from 'lucide-react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/services/supabaseClient';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import EmojiPicker from '@/components/ui/EmojiPicker';
import Markdown from 'react-native-markdown-display';
import ThreadView from './components/chat/ThreadView';
import MessageItem from './components/chat/MessageItem';
import { MentionPicker } from './components/chat/MentionPicker';
import { Tables } from '@/types/supabase';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Message, MessageAttachment, MessageReaction } from './types/chat';
import { TeamMemberWithProfile } from './types/team';

type TeamMessage = Tables<'team_messages'>;

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Tillåtna filtyper
const ALLOWED_MIME_TYPES = {
  // Bilder
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

// Flytta formatTime funktionen utanför komponenterna
const formatTime = (date: string) => {
  const messageDate = new Date(date);
  return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ff4444',
    textAlign: 'center',
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
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInputContainer: {
    flex: 1,
    marginRight: 8,
    position: 'relative',
  },
  textInput: {
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  formattingToolbar: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  attachButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  fileName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionPickerContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    zIndex: 1000,
  },
});

export default function TeamChatScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { markAsRead } = useUnreadMessages();
  const [messages, setMessages] = useState<MessageWithReactions[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const teamId = params.teamId as string | undefined;

  useEffect(() => {
    if (!teamId) {
      setError('Du behöver välja ett team för att använda chatten');
      return;
    }

    loadMessages();
    markAsRead();

    const messageChannel = supabase
      .channel('team_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`,
        },
        handleNewMessage
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel('message_reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        handleReactionChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [teamId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Hämta meddelanden
      const { data: messages, error: messagesError } = await supabase
        .from('team_messages')
        .select(`
          *,
          profiles (
            id,
            name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) throw messagesError;

      // Hämta reaktioner för alla meddelanden
      const messageIds = messages.map(msg => msg.id);
      const { data: reactions, error: reactionsError } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      if (reactionsError) throw reactionsError;

      // Kombinera meddelanden med reaktioner
      const enrichedMessages = messages.map(msg => ({
        ...msg,
        user: {
          name: msg.profiles?.name || 'Okänd användare',
          avatar_url: msg.profiles?.avatar_url
        },
        attachments: msg.attachments || [],
        reactions: reactions?.filter(r => r.message_id === msg.id) || []
      }));

      setMessages(enrichedMessages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Kunde inte ladda meddelanden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = async (payload: { new: TeamMessage }) => {
    const newMessage = payload.new;
    
    try {
      // Hämta användarinformation
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', newMessage.user_id)
        .single();

      if (userError) throw userError;

      // Hämta eventuella reaktioner
      const { data: reactions, error: reactionsError } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', newMessage.id);

      if (reactionsError) throw reactionsError;

      const fullMessage: MessageWithReactions = {
        ...newMessage,
        user: {
          name: userData.name,
          avatar_url: userData.avatar_url
        },
        attachments: [],
        reactions: reactions || []
      };

      setMessages((prev) => [...prev, fullMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  const handleReactionChange = async (payload: { new: MessageReaction; old: MessageReaction }) => {
    const { data: reactions } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', payload.new.message_id);

    if (reactions) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === payload.new.message_id 
            ? { ...msg, reactions }
            : msg
        )
      );
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const uploadImage = async (image: ImagePicker.ImagePickerAsset): Promise<MessageAttachment | null> => {
    if (!image.base64) return null;

    try {
      const response = await fetch(`data:image/jpeg;base64,${image.base64}`);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(image.fileName || 'image.jpg', blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(uploadData.path);

      const attachment = {
        type: 'image' as const,
        url: publicUrl,
        filename: image.fileName || 'image.jpg',
        size: image.fileSize,
        mime_type: 'image/jpeg'
      };

      return attachment;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const pickFile = async () => {
    try {
      alert('För tillfället stöds endast bilduppladdningar. För andra filtyper, vänligen använd en bildskärmsavbild eller konvertera till PDF och ta en bild.');
      return;

      // Temporärt inaktiverad filuppladdning
      const result = await DocumentPicker.getDocumentAsync({
        type: Object.keys(ALLOWED_MIME_TYPES),
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileInfo = result.assets[0];
      
      // Kontrollera filstorlek
      if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
        alert('Filen är för stor. Max filstorlek är 10MB.');
        return;
      }

      // Kontrollera filtyp
      if (!ALLOWED_MIME_TYPES[fileInfo.mimeType]) {
        alert('Endast bilder stöds för tillfället (JPG, PNG, GIF, WEBP).');
        return;
      }

      setSelectedFile(result);
    } catch (error) {
      console.error('Error picking file:', error);
      alert('Det gick inte att välja fil');
    }
  };

  const uploadFile = async (file: DocumentPicker.DocumentAsset): Promise<MessageAttachment | null> => {
    try {
      let blob: Blob;
      
      if (Platform.OS === 'web') {
        // För webb, hämta filen direkt som blob
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error('Kunde inte läsa filen');
        }
        blob = await response.blob();
      } else {
        // För mobil, använd FileSystem
        try {
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const response = await fetch(`data:${file.mimeType};base64,${base64}`);
          blob = await response.blob();
        } catch (error) {
          console.error('Error reading file:', error);
          throw new Error('Kunde inte läsa filen');
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(file.name, blob, {
          contentType: file.mimeType,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Kunde inte ladda upp filen');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(uploadData.path);

      const attachment = {
        type: 'file' as const,
        url: publicUrl,
        filename: file.name,
        size: file.size,
        mime_type: file.mimeType
      };

      return attachment;
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Det gick inte att ladda upp filen');
      return null;
    }
  };

  const sendMessage = async (content: string, threadId?: string, parentId?: string) => {
    if (!content.trim() && !selectedImage && !selectedFile) return;
    if (isUploading) return;

    const messageToSend = content.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setIsUploading(true);
      let attachments: MessageAttachment[] = [];

      if (selectedImage) {
        const attachment = await uploadImage(selectedImage);
        if (attachment) {
          attachments.push(attachment);
        }
        setSelectedImage(null);
      }

      if (selectedFile && !selectedFile.canceled) {
        const fileAsset = selectedFile.assets[0];
        const attachment = await uploadFile(fileAsset);
        if (attachment) {
          attachments.push(attachment);
        }
        setSelectedFile(null);
      }

      const messageType = attachments.length > 0 
        ? messageToSend 
          ? 'mixed' 
          : attachments[0].type
        : 'text';

      // Extract mentions from message content
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      const mentions = [];
      while ((match = mentionRegex.exec(messageToSend)) !== null) {
        mentions.push({
          name: match[1],
          id: match[2]
        });
      }

      // Create the message
      const { data: messageData, error: messageError } = await supabase
        .from('team_messages')
        .insert({
          team_id: teamId,
          user_id: user?.id,
          content: messageToSend,
          attachments,
          message_type: messageType,
          thread_id: threadId,
          parent_id: parentId,
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

      if (messageError) throw messageError;

      setIsUploading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setIsUploading(false);
    }
  };

  const handleThreadPress = (message: Message) => {
    setSelectedThread(message);
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

  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    // Check for @ symbol
    const lastAtSymbol = text.lastIndexOf('@');
    if (lastAtSymbol !== -1 && lastAtSymbol >= mentionStartIndex) {
      const searchQuery = text.slice(lastAtSymbol + 1);
      setMentionSearchQuery(searchQuery);
      setShowMentionPicker(true);
      setMentionStartIndex(lastAtSymbol);
    } else if (mentionStartIndex !== -1 && text.length < mentionStartIndex) {
      // User deleted the @ symbol
      setShowMentionPicker(false);
      setMentionStartIndex(-1);
      setMentionSearchQuery('');
    }
  };

  const handleMentionSelect = (member: { id: string; name: string; role: string }) => {
    const beforeMention = newMessage.slice(0, mentionStartIndex);
    const afterMention = newMessage.slice(mentionStartIndex + mentionSearchQuery.length + 1);
    const newText = `${beforeMention}@[${member.name}](${member.id})${afterMention}`;
    
    setNewMessage(newText);
    setShowMentionPicker(false);
    setMentionStartIndex(-1);
    setMentionSearchQuery('');
  };

  const renderMessageContent = (content: string, mentions?: { id: string; name: string }[]) => {
    if (!content) return null;

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];

    if (mentions && Array.isArray(mentions)) {
      mentions.forEach((mention, index) => {
        const mentionText = `@${mention.name}`;
        const mentionIndex = content.indexOf(mentionText, lastIndex);

        if (mentionIndex !== -1) {
          // Add text before mention
          if (mentionIndex > lastIndex) {
            parts.push(
              <Text key={`text-${index}`} style={{ color: colors.text.main }}>
                {content.substring(lastIndex, mentionIndex)}
              </Text>
            );
          }

          // Add mention
          parts.push(
            <Text
              key={`mention-${index}`}
              style={{
                color: colors.primary.main,
                fontWeight: 'bold',
              }}
            >
              {mentionText}
            </Text>
          );

          lastIndex = mentionIndex + mentionText.length;
        }
      });
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <Text key="text-end" style={{ color: colors.text.main }}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? <Text>{parts}</Text> : <Text style={{ color: colors.text.main }}>{content}</Text>;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageItem
      message={item}
      onThreadPress={handleThreadPress}
      onReaction={handleReaction}
      renderContent={renderMessageContent}
      currentUserId={user?.id}
    />
  );

  const insertMarkdownSyntax = (syntax: string, wrapper: string) => {
    const textInput = newMessage;
    const selectionStart = textInput.length;
    const selectionEnd = textInput.length;
    const beforeText = textInput.substring(0, selectionStart);
    const afterText = textInput.substring(selectionEnd);

    if (syntax === 'list') {
      setNewMessage(newMessage + '\n- ');
    } else {
      setNewMessage(beforeText + wrapper + syntax + wrapper + afterText);
    }
  };

  return (
    <Container>
      <Header
        title="Teamchatt"
        leftIcon={ArrowLeft}
        onLeftPress={() => router.push(`/(tabs)/team/${teamId}`)}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {selectedThread ? (
          <ThreadView
            parentMessage={selectedThread}
            onClose={() => setSelectedThread(null)}
            onSendReply={sendMessage}
            teamId={teamId || ''}
          />
        ) : (
          <>
            <View style={styles.content}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary.main} />
                  <Text style={styles.loadingText}>Laddar meddelanden...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Inga meddelanden än. Var först med att skriva något!
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  style={styles.messagesList}
                  data={messages}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <MessageItem
                      message={item}
                      onThreadPress={handleThreadPress}
                      onReaction={handleReaction}
                      renderContent={renderMessageContent}
                      currentUserId={user?.id}
                    />
                  )}
                  inverted
                />
              )}
            </View>

            <View style={[
              styles.inputContainer,
              { borderTopColor: colors.neutral[800] }
            ]}>
              {showFormattingToolbar && (
                <View style={[
                  styles.formattingToolbar,
                  { backgroundColor: colors.neutral[800] }
                ]}>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertMarkdownSyntax('**', 'bold')}
                  >
                    <Bold size={20} color={colors.text.light} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertMarkdownSyntax('*', 'italic')}
                  >
                    <Italic size={20} color={colors.text.light} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertMarkdownSyntax('- ', 'list')}
                  >
                    <List size={20} color={colors.text.light} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => insertMarkdownSyntax('[]()', 'link')}
                  >
                    <LinkIcon size={20} color={colors.text.light} />
                  </TouchableOpacity>
                </View>
              )}

              {(selectedImage || selectedFile) && (
                <View style={styles.attachmentsPreview}>
                  {selectedImage && (
                    <View>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedFile && 'assets' in selectedFile && selectedFile.assets[0] && (
                    <View style={styles.filePreview}>
                      <FileText size={24} color={colors.text.light} />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile.assets[0].name}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => setSelectedFile(null)}
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.inputWrapper}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.neutral[800],
                        color: colors.text.main,
                      }
                    ]}
                    value={newMessage}
                    onChangeText={handleTextChange}
                    placeholder="Skriv ett meddelande..."
                    placeholderTextColor={colors.neutral[400]}
                    multiline
                    maxLength={1000}
                  />

                  <TouchableOpacity
                    style={styles.attachButton}
                    onPress={() => {
                      const options = [
                        { label: 'Bild', onPress: pickImage },
                        { label: 'Fil', onPress: pickFile },
                      ];
                      // Visa en ActionSheet eller liknande här
                    }}
                  >
                    <Paperclip size={20} color={colors.text.light} />
                  </TouchableOpacity>

                  {showMentionPicker && (
                    <View style={styles.mentionPickerContainer}>
                      <MentionPicker
                        members={[]}  // Fyll i med teammedlemmar
                        searchQuery={mentionSearchQuery}
                        onSelect={handleMentionSelect}
                      />
                    </View>
                  )}
                </View>

                <Button
                  Icon={Send}
                  onPress={() => sendMessage(newMessage)}
                  variant="primary"
                  size="medium"
                  style={[
                    styles.sendButton,
                    !newMessage.trim() && { opacity: 0.5 }
                  ]}
                  disabled={!newMessage.trim() || isUploading}
                />
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Container>
  );
}
