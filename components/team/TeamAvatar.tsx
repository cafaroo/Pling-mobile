import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

type TeamAvatarProps = {
  teamId: string;
  imageUrl?: string | null;
  size?: number;
  onPress?: () => void;
  editable?: boolean;
  loading?: boolean;
  style?: any;
};

const FALLBACK_COLORS = [
  ['#FF5722', '#FF9800'],
  ['#9C27B0', '#673AB7'],
  ['#3F51B5', '#2196F3'],
  ['#009688', '#4CAF50'],
  ['#FFC107', '#FFEB3B'],
  ['#607D8B', '#9E9E9E'],
  ['#E91E63', '#F44336'],
];

const getGradientForTeam = (teamId: string) => {
  // Använd teamId för att generera en konsekvent gradient
  const hashCode = teamId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hashCode) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
};

const getInitialsFromTeamId = (teamId: string): string => {
  // Generera en default-bokstav baserat på teamId
  const hashCode = teamId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Använd hashkoden för att generera en bokstav A-Z
  const charCode = (Math.abs(hashCode) % 26) + 65;
  return String.fromCharCode(charCode);
};

const TeamAvatar: React.FC<TeamAvatarProps> = ({
  teamId,
  imageUrl,
  size = 64,
  onPress,
  editable = false,
  loading = false,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  
  const gradientColors = getGradientForTeam(teamId);
  const initials = getInitialsFromTeamId(teamId);
  
  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.avatar, { width: size, height: size }]}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }

    if (!imageUrl || imageError) {
      return (
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 }
          ]}
        >
          <Avatar.Text 
            size={size} 
            label={initials}
            labelStyle={styles.initials}
            style={styles.transparent}
          />
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          transition={300}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {isLoading && (
          <View style={[styles.loadingOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  };

  const renderEditableIcon = () => {
    if (!editable) return null;
    
    return (
      <View style={[
        styles.editIconContainer, 
        { 
          right: size * 0.05, 
          bottom: size * 0.05,
          width: size * 0.3, 
          height: size * 0.3, 
          borderRadius: size * 0.15
        }
      ]}>
        <MaterialCommunityIcons name="camera" size={size * 0.15} color="white" />
      </View>
    );
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...style
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, containerStyle]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {renderContent()}
        {renderEditableIcon()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {renderContent()}
      {renderEditableIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
});

export default TeamAvatar; 