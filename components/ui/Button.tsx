import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  style?: object;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  
  // Determine button and text colors based on variant
  const getButtonStyle = () => {
    if (disabled) {
      return {
        backgroundColor: variant === 'outline' ? 'transparent' : colors.neutral[500],
        borderColor: variant === 'outline' ? colors.neutral[500] : 'transparent',
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary.main,
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          backgroundColor: colors.accent.yellow,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary.main,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.neutral[400];
    }
    
    switch (variant) {
      case 'primary':
        return colors.text.main;
      case 'secondary':
        return colors.background.dark;
      case 'outline':
        return colors.primary.main;
    }
  };

  // Determine button size
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
    }
  };

  // Determine icon size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
    }
  };

  // Determine text size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getButtonSize(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          size={getIconSize()}
        />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' && (
            <Icon
              color={getTextColor()}
              size={getIconSize()}
              style={styles.iconLeft}
            />
          )}
          
          <Text
            style={[
              styles.text,
              { color: getTextColor(), fontSize: getTextSize() },
            ]}
          >
            {title}
          </Text>
          
          {Icon && iconPosition === 'right' && (
            <Icon
              color={getTextColor()}
              size={getIconSize()}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});