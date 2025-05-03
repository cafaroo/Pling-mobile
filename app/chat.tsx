import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Send, ArrowLeft, Image as ImageIcon, X, Paperclip, FileText, Download, Smile, Bold, Italic, List, Link as LinkIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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
import Button from '@/components/ui/Button';
import EmojiPicker from '@/components/ui/EmojiPicker';
import Markdown from 'react-native-markdown-display';
import { ThreadView } from './components/chat/ThreadView';
import { MessageItem } from './components/chat/MessageItem';
import { Tables } from '@/types/supabase';
import MentionPicker from './components/chat/MentionPicker';

type TeamMessage = Tables<'team_messages'>;
type MessageAttachment = {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
};

type MessageReaction = Tables<'message_reactions'>;

type Message = TeamMessage & {
  user: {
    name: string;
    avatar_url: string;
  };
  reactions?: MessageReaction[];
  mentions?: {
    id: string;
    name: string;
  }[];
  attachments: MessageAttachment[];
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

export default function TeamChatScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { markAsRead } = useUnreadMessages();
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    if (!user?.team?.id) return;

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
          filter: `team_id=eq.${user.team.id}`,
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
  }, [user?.team?.id]);

  const handleNewMessage = async (payload: { new: TeamMessage }) => {
    const newMessage = payload.new;
    const { data: userData } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', newMessage.user_id)
      .single();

    if (userData) {
      const fullMessage: Message = {
        ...newMessage,
        user: {
          name: userData.name,
          avatar_url: userData.avatar_url
        },
        attachments: [],
        reactions: []
      };

      setMessages((prev) => [...prev, fullMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: messages, error } = await supabase
        .rpc('get_recent_team_messages', {
          team_id_param: user?.team?.id,
          limit_count: 50
        });

      if (error) throw error;

      // Hämta användarinformation för alla meddelanden
      const userIds = [...new Set(messages.map(m => m.user_id))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const userMap = users?.reduce((acc, user) => ({
        ...acc,
        [user.id]: user
      }), {}) || {};

      const enrichedMessages = messages.map(msg => ({
        ...msg,
        user: {
          name: userMap[msg.user_id]?.name || 'Okänd användare',
          avatar_url: userMap[msg.user_id]?.avatar_url
        },
        attachments: msg.attachments || [],
        reactions: []
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Kunde inte ladda meddelanden');
    } finally {
      setIsLoading(false);
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
        .from('team_messages_new')
        .insert({
          team_id: user?.team?.id,
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

    if (mentions) {
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

    return <Text>{parts}</Text>;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageItem
      message={item}
      onThreadPress={handleThreadPress}
      onReaction={handleReaction}
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
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.container}>
          {!user?.team?.id ? (
            <View style={styles.centeredContainer}>
              <Text style={[styles.centeredText, { color: colors.text.light }]}>
                Du behöver vara med i ett team för att använda chatten
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <Text style={[styles.centeredText, { color: colors.text.light }]}>
                Laddar meddelanden...
              </Text>
            </View>
          ) : (
            <>
              {selectedThread ? (
                <ThreadView
                  parentMessage={selectedThread}
                  onClose={() => setSelectedThread(null)}
                  onSendReply={async (content, threadId, parentId) => {
                    await sendMessage(content, threadId, parentId);
                  }}
                  teamId={user?.team?.id || selectedThread.team_id}
                />
              ) : (
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
              )}
              
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    onPress={() => setError(null)}
                    style={styles.errorDismiss}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              {(selectedImage || selectedFile) && (
                <View style={[
                  styles.selectedMediaContainer, 
                  { backgroundColor: colors.neutral[800] }
                ]}>
                  {selectedImage && (
                    <View style={styles.selectedMediaPreview}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.selectedMediaImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => setSelectedImage(null)}
                        style={[styles.removeMediaButton, { backgroundColor: colors.error }]}
                      >
                        <X size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={[
                styles.inputContainer,
                { backgroundColor: colors.background.light }
              ]}>
                {showFormattingToolbar && (
                  <View style={[
                    styles.formattingToolbar,
                    { backgroundColor: colors.neutral[800] }
                  ]}>
                    <TouchableOpacity
                      style={[styles.toolbarButton, { backgroundColor: colors.primary.main }]}
                      onPress={() => insertMarkdownSyntax('text', '**')}
                    >
                      <Bold size={20} color={colors.text.light} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toolbarButton, { backgroundColor: colors.primary.main }]}
                      onPress={() => insertMarkdownSyntax('text', '*')}
                    >
                      <Italic size={20} color={colors.text.light} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toolbarButton, { backgroundColor: colors.primary.main }]}
                      onPress={() => insertMarkdownSyntax('list', '')}
                    >
                      <List size={20} color={colors.text.light} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toolbarButton, { backgroundColor: colors.primary.main }]}
                      onPress={() => insertMarkdownSyntax('[länktext](url)', '')}
                    >
                      <LinkIcon size={20} color={colors.text.light} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputRow}>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={[styles.inputButton, { backgroundColor: colors.primary.main }]}
                  >
                    <ImageIcon size={20} color={colors.text.light} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowFormattingToolbar(!showFormattingToolbar)}
                    style={[
                      styles.inputButton, 
                      { 
                        backgroundColor: showFormattingToolbar 
                          ? colors.primary.dark 
                          : colors.primary.main 
                      }
                    ]}
                  >
                    <Bold size={20} color={colors.text.light} />
                  </TouchableOpacity>

                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      {
                        color: colors.text.main,
                        backgroundColor: colors.neutral[50],
                        borderColor: colors.neutral[200],
                        borderWidth: 1,
                      },
                    ]}
                    value={newMessage}
                    onChangeText={handleTextChange}
                    placeholder="Skriv ett meddelande..."
                    placeholderTextColor={colors.neutral[400]}
                    multiline
                    numberOfLines={1}
                    maxLength={1000}
                    returnKeyType="default"
                    blurOnSubmit={false}
                  />

                  {showMentionPicker && (
                    <MentionPicker
                      teamId={user?.team?.id || ''}
                      onSelect={handleMentionSelect}
                      onClose={() => setShowMentionPicker(false)}
                      searchQuery={mentionSearchQuery}
                    />
                  )}

                  {isUploading ? (
                    <View style={[styles.sendButton, { backgroundColor: colors.primary.main }]}>
                      <ActivityIndicator color={colors.text.light} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        {
                          backgroundColor: newMessage.trim() || selectedImage || selectedFile
                            ? colors.primary.main
                            : colors.neutral[400]
                        }
                      ]}
                      onPress={() => {
                        const message = newMessage.trim();
                        if (message) {
                          sendMessage(message);
                        }
                      }}
                      disabled={!newMessage.trim() && !selectedImage && !selectedFile}
                    >
                      <Send size={20} color={colors.text.light} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  messagesList: {
    flexGrow: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
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
  selectedMediaContainer: {
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  selectedMediaPreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedMediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  formattingToolbar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    gap: 8,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
