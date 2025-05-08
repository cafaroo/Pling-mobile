import React from 'react';
import { View, StyleSheet, Image, Linking, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Icon, useTheme } from 'react-native-paper';

interface Attachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

interface MessageAttachmentViewProps {
  attachment: Attachment;
}

export function MessageAttachmentView({ attachment }: MessageAttachmentViewProps) {
  const theme = useTheme();
  
  const handlePress = async () => {
    try {
      const supported = await Linking.canOpenURL(attachment.url);
      
      if (supported) {
        await Linking.openURL(attachment.url);
      } else {
        Alert.alert(
          'Fel',
          'Kan inte öppna denna URL: ' + attachment.url,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Fel',
        'Ett fel uppstod när länken skulle öppnas',
        [{ text: 'OK' }]
      );
    }
  };
  
  const getFileIcon = () => {
    if (!attachment.name) return 'file-outline';
    
    const extension = attachment.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'file-pdf-box';
      case 'doc':
      case 'docx':
        return 'file-word-outline';
      case 'xls':
      case 'xlsx':
        return 'file-excel-outline';
      case 'ppt':
      case 'pptx':
        return 'file-powerpoint-outline';
      case 'zip':
      case 'rar':
      case '7z':
        return 'zip-box-outline';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'file-image-outline';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'file-music-outline';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'file-video-outline';
      default:
        return 'file-outline';
    }
  };
  
  const getFormattedSize = () => {
    if (!attachment.size) return '';
    
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    
    if (attachment.size < kb) {
      return `${attachment.size} B`;
    } else if (attachment.size < mb) {
      return `${(attachment.size / kb).toFixed(1)} KB`;
    } else if (attachment.size < gb) {
      return `${(attachment.size / mb).toFixed(1)} MB`;
    } else {
      return `${(attachment.size / gb).toFixed(1)} GB`;
    }
  };
  
  if (attachment.type === 'image') {
    return (
      <TouchableOpacity onPress={handlePress}>
        <Card style={styles.imageCard}>
          <Image 
            source={{ uri: attachment.url }} 
            style={styles.image} 
            resizeMode="cover"
          />
          {attachment.name && (
            <View style={styles.imageInfo}>
              <Text style={styles.imageCaption}>{attachment.name}</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  }
  
  if (attachment.type === 'file') {
    return (
      <TouchableOpacity onPress={handlePress}>
        <View style={styles.fileContainer}>
          <Icon
            source={getFileIcon()}
            size={36}
            color={theme.colors.primary}
          />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{attachment.name || 'Fil'}</Text>
            {attachment.size && (
              <Text style={styles.fileSize}>{getFormattedSize()}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  if (attachment.type === 'link') {
    return (
      <TouchableOpacity onPress={handlePress}>
        <View style={styles.linkContainer}>
          <Icon
            source="link-variant"
            size={20}
            color={theme.colors.primary}
          />
          <Text 
            style={[styles.linkText, { color: theme.colors.primary }]} 
            numberOfLines={1}
          >
            {attachment.name || attachment.url}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  imageCard: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8
  },
  imageInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  imageCaption: {
    color: 'white',
    fontSize: 12
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8
  },
  fileInfo: {
    marginLeft: 12,
    flex: 1
  },
  fileName: {
    fontWeight: 'bold'
  },
  fileSize: {
    fontSize: 12,
    opacity: 0.7
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  linkText: {
    marginLeft: 6,
    textDecorationLine: 'underline'
  }
}); 