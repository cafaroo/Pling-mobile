import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';
import { FolderOpen, AlertCircle, Users, Info } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: React.ElementType | string;
  iconColor?: string;
}

export const EmptyState = ({ title, message, action, icon, iconColor }: EmptyStateProps) => {
  const { colors } = useTheme();
  
  // Bestäm vilken ikon som ska användas
  const IconComponent = React.useMemo(() => {
    if (typeof icon === 'function') {
      return icon;
    }
    
    // Om icon är en sträng, välj från fördefinierade ikoner
    if (typeof icon === 'string') {
      switch (icon) {
        case 'users':
          return Users;
        case 'alert-circle':
          return AlertCircle;
        case 'info':
          return Info;
        case 'folder-open':
        default:
          return FolderOpen;
      }
    }
    
    // Standardikon
    return FolderOpen;
  }, [icon]);

  return (
    <View style={styles.container}>
      <IconComponent
        size={48}
        color={iconColor || colors.text.light}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text.main }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.text.light }]}>
        {message}
      </Text>
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="primary"
          size="medium"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});

export default EmptyState; 