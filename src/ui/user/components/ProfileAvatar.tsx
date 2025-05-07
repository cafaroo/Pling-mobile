import React from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity } from 'react-native';
import { Avatar, IconButton, useTheme } from 'react-native-paper';

interface ProfileAvatarProps {
  uri?: string;
  size: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  uri,
  size,
  onPress,
  style
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        {uri ? (
          <Avatar.Image
            size={size}
            source={{ uri }}
          />
        ) : (
          <Avatar.Icon
            size={size}
            icon="account"
          />
        )}
      </TouchableOpacity>
      {onPress && (
        <IconButton
          icon="camera"
          size={24}
          onPress={onPress}
          style={[
            styles.cameraButton,
            { backgroundColor: theme.colors.surface }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
}); 