import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Keyboard, Alert, Text } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@context/AuthContext';
import { useStorage } from '@/lib/useStorage';
import { MessageAttachmentData } from '@/domain/team/entities/TeamMessage';
import { useCreateThreadReply } from '@/application/team/hooks/useCreateThreadReply';

interface MessageComposerProps {
  teamId: string;
  onSendMessage: (content: string, attachments: MessageAttachmentData[]) => void;
  isLoading: boolean;
  parentId?: string;
  onMessageSent?: () => void;
}

export function MessageComposer({
  teamId,
  onSendMessage,
  isLoading: 외부isLoading,
  parentId,
  onMessageSent
}: MessageComposerProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const { uploadFile } = useStorage();
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachmentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const inputRef = useRef<TextInput>(null);

  const createThreadReply = useCreateThreadReply();

  const internalIsLoading = createThreadReply.isLoading;
  const finalIsLoading = 외부isLoading || internalIsLoading || isUploading;
  
  const handleSendPress = async () => {
    if (!message.trim() && attachments.length === 0) {
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Fel', 'Du måste vara inloggad för att skicka meddelanden');
      return;
    }
    
    try {
      let success = false;
      if (parentId) {
        const result = await createThreadReply.mutateAsync({
          parentId,
          teamId,
          senderId: user.id,
          content: message.trim(),
        });
        if (result.isOk()) {
          success = true;
        } else {
          Alert.alert('Fel', `Kunde inte skicka svar: ${result.unwrapErr()}`);
        }
      } else {
        onSendMessage(message.trim(), attachments);
        success = true;
      }

      if (success) {
        setMessage('');
        setAttachments([]);
        Keyboard.dismiss();
        onMessageSent?.();
      }
    } catch (error: any) {
      Alert.alert('Fel', `Ett oväntat fel inträffade: ${error.message || String(error)}`);
    }
  };
  
  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Behörighet saknas', 'Du måste ge appen tillstånd att komma åt dina bilder');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploading(true);
        
        const fileUri = asset.uri;
        const fileName = fileUri.split('/').pop() || `image_${new Date().getTime()}.jpg`;
        
        try {
          const uploadResult = await uploadFile(fileUri, `team/${teamId}/messages/images/${fileName}`);
          
          if (uploadResult.isErr()) {
            Alert.alert('Fel', `Kunde inte ladda upp bild: ${uploadResult.unwrapErr()}`);
            return;
          }
          
          const imageUrl = uploadResult.unwrap();
          setAttachments([
            ...attachments, 
            {
              type: 'image',
              url: imageUrl,
              name: fileName,
              size: asset.fileSize || 0,
              mimeType: asset.mimeType || 'image/jpeg'
            }
          ]);
        } catch (error) {
          Alert.alert('Fel', `Ett fel uppstod vid uppladdning: ${error.message}`);
        }
      }
    } catch (error) {
      Alert.alert('Fel', `Ett fel uppstod: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      
      const asset = result.assets[0];
      setIsUploading(true);
      
      try {
        const uploadResult = await uploadFile(
          asset.uri, 
          `team/${teamId}/messages/files/${asset.name}`
        );
        
        if (uploadResult.isErr()) {
          Alert.alert('Fel', `Kunde inte ladda upp fil: ${uploadResult.unwrapErr()}`);
          return;
        }
        
        const fileUrl = uploadResult.unwrap();
        setAttachments([
          ...attachments, 
          {
            type: 'file',
            url: fileUrl,
            name: asset.name,
            size: asset.size,
            mimeType: asset.mimeType
          }
        ]);
      } catch (error) {
        Alert.alert('Fel', `Ett fel uppstod vid uppladdning: ${error.message}`);
      }
    } catch (error) {
      Alert.alert('Fel', `Ett fel uppstod: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  return (
    <View style={styles.container}>
      {attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentChip}>
              <View style={styles.attachmentContent}>
                <IconButton
                  icon={attachment.type === 'image' ? 'image' : 'file'}
                  size={16}
                />
                <View style={styles.attachmentTextContainer}>
                  <Text numberOfLines={1} style={styles.attachmentText}>
                    {attachment.name || 'Bilaga'}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="close"
                size={16}
                onPress={() => handleRemoveAttachment(index)}
              />
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={handleFilePicker}
          disabled={finalIsLoading}
        />
        
        <IconButton
          icon="image"
          size={24}
          onPress={handleImagePicker}
          disabled={finalIsLoading}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Skriv ett meddelande..."
          multiline
          maxLength={4000}
          editable={!finalIsLoading}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: 
                (!message.trim() && attachments.length === 0) || finalIsLoading 
                  ? theme.colors.surfaceVariant
                  : theme.colors.primary
            }
          ]}
          onPress={handleSendPress}
          disabled={(!message.trim() && attachments.length === 0) || finalIsLoading}
        >
          <IconButton
            icon="send"
            size={20}
            iconColor={'white'}
            disabled={(!message.trim() && attachments.length === 0) || finalIsLoading}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
    paddingVertical: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8
  },
  attachmentContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attachmentTextContainer: {
    maxWidth: 120
  },
  attachmentText: {
    fontSize: 12
  }
}); 