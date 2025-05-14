import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Camera, ImagePlus, X, Check, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProgressBar } from '@/components/ui/ProgressBar';

/**
 * Props för AvatarUploader-komponenten
 * 
 * @interface AvatarUploaderProps
 * @property {string} [currentAvatarUrl] - URL till nuvarande avatar (om den finns)
 * @property {(file: any) => Promise<string>} onUpload - Callback som anropas vid uppladdning
 * @property {() => Promise<void>} [onRemove] - Callback som anropas vid borttagning
 * @property {number} [size] - Storlek på avataren i pixlar
 * @property {string} [placeholder] - Text som visas om det inte finns någon avatar
 * @property {boolean} [showRemoveButton] - Om borttagningsknapp ska visas
 * @property {any} [style] - Ytterligare stil för komponenten
 */
interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  onUpload: (file: any) => Promise<string>;
  onRemove?: () => Promise<void>;
  size?: number;
  placeholder?: string;
  showRemoveButton?: boolean;
  style?: any;
}

/**
 * Komponent för att ladda upp och hantera avatarbilder
 * 
 * Denna komponent erbjuder ett användargränssnitt för att ladda upp, visa och ta bort
 * avatarbilder. Den har stöd för att välja bilder från galleriet eller kameran,
 * och visar uppladdningsförlopp när en fil laddas upp.
 * 
 * @param {AvatarUploaderProps} props - Komponentens props
 * @returns {React.ReactElement} Renderad avatarväljare
 * 
 * @example
 * <AvatarUploader
 *   currentAvatarUrl={team.profile_image}
 *   onUpload={handleUploadImage}
 *   onRemove={handleRemoveImage}
 *   size={120}
 *   placeholder="TN"
 * />
 */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatarUrl,
  onUpload,
  onRemove,
  size = 120,
  placeholder = '',
  showRemoveButton = true,
  style
}) => {
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Generera initialer för placeholder
  const getInitials = () => {
    if (!placeholder) return '?';
    
    return placeholder
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  // Hantera bildval från galleriet
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUpload(result.assets[0]);
      }
    } catch (error) {
      setError('Kunde inte välja bild. Försök igen.');
      console.error('Error picking image:', error);
    }
  };
  
  // Hantera bildtagning från kamera
  const handleTakePhoto = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        setError('Kamerabehörighet krävs för att ta en bild.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUpload(result.assets[0]);
      }
    } catch (error) {
      setError('Kunde inte ta en bild. Försök igen.');
      console.error('Error taking photo:', error);
    }
  };
  
  // Hantera uppladdning av vald bild
  const handleUpload = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    if (isUploading) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Visa förhandsgranskning av bilden som ska laddas upp
      setPreviewUrl(imageAsset.uri);
      
      // Simulera uppladdningsförlopp (detta ersätts vanligtvis med riktig uppladdningslogik)
      const uploadTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Konvertera bilden till en fil
      const fileInfo = {
        uri: imageAsset.uri,
        type: `image/${imageAsset.uri.split('.').pop()}`,
        name: `avatar.${imageAsset.uri.split('.').pop()}`,
      };
      
      // Utför faktisk uppladdning via callback
      const url = await onUpload(fileInfo);
      
      // Slutför uppladdningsförloppet
      setUploadProgress(100);
      clearInterval(uploadTimer);
      
      // Uppdatera förhandsgranskningen med den faktiska URL:en
      setTimeout(() => {
        setPreviewUrl(null);
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
      
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Kunde inte ladda upp bilden. Försök igen senare.');
      setPreviewUrl(null);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };
  
  // Hantera borttagning av nuvarande avatar
  const handleRemove = async () => {
    if (!onRemove) return;
    
    Alert.alert(
      'Ta bort bild',
      'Är du säker på att du vill ta bort den nuvarande profilbilden?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              await onRemove();
              setIsUploading(false);
            } catch (error) {
              console.error('Error removing image:', error);
              setError('Kunde inte ta bort bilden. Försök igen senare.');
              setIsUploading(false);
            }
          }
        }
      ]
    );
  };
  
  // Renderar avatarbild eller placeholder
  const renderAvatar = () => {
    // Om det finns en förhandsgransknings-URL, visa den
    if (previewUrl) {
      return (
        <Image 
          source={{ uri: previewUrl }} 
          style={[
            styles.avatarImage,
            { width: size, height: size, borderRadius: size / 2 }
          ]}
        />
      );
    }
    
    // Om det finns en nuvarande avatar-URL, visa den
    if (currentAvatarUrl) {
      return (
        <Image 
          source={{ uri: currentAvatarUrl }} 
          style={[
            styles.avatarImage,
            { width: size, height: size, borderRadius: size / 2 }
          ]}
        />
      );
    }
    
    // Annars visa placeholder
    return (
      <View 
        style={[
          styles.avatarPlaceholder,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: colors.primary.light
          }
        ]}
      >
        <Text style={[styles.placeholderText, { color: colors.primary.dark }]}>
          {getInitials()}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatarContainer}>
        {renderAvatar()}
        
        {isUploading && (
          <View style={[
            styles.uploadingOverlay,
            { width: size, height: size, borderRadius: size / 2 }
          ]}>
            <ActivityIndicator color={colors.primary.main} size="large" />
          </View>
        )}
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={uploadProgress / 100}
              color={colors.primary.main}
              backgroundColor={colors.background.light}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, { color: colors.text.light }]}>
              {Math.round(uploadProgress)}%
            </Text>
          </View>
        )}
        
        {showRemoveButton && currentAvatarUrl && !isUploading && (
          <TouchableOpacity 
            style={[
              styles.removeButton,
              { backgroundColor: colors.error }
            ]}
            onPress={handleRemove}
            disabled={isUploading}
          >
            <X size={16} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary.main }
          ]}
          onPress={handlePickImage}
          disabled={isUploading}
        >
          <ImagePlus size={18} color="#FFF" />
          <Text style={styles.actionText}>Välj bild</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.secondary.main }
          ]}
          onPress={handleTakePhoto}
          disabled={isUploading}
        >
          <Camera size={18} color="#FFF" />
          <Text style={styles.actionText}>Ta foto</Text>
        </TouchableOpacity>
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    backgroundColor: '#E1E1E1',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 110,
  },
  actionText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  progressContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
  },
}); 