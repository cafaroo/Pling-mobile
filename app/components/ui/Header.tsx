import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LucideIcon } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  leftIcon?: LucideIcon;
  onLeftPress?: () => void;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
}

export default function Header({ 
  title, 
  leftIcon: LeftIcon,
  onLeftPress,
  rightIcon: RightIcon,
  onRightPress 
}: HeaderProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.header, { backgroundColor: colors.background.dark }]}>
      {LeftIcon && (
        <TouchableOpacity 
          onPress={onLeftPress}
          style={styles.iconButton}
        >
          <LeftIcon size={24} color={colors.text.main} />
        </TouchableOpacity>
      )}
      
      <Text style={[styles.title, { color: colors.text.main }]}>
        {title}
      </Text>
      
      {RightIcon && (
        <TouchableOpacity 
          onPress={onRightPress}
          style={styles.iconButton}
        >
          <RightIcon size={24} color={colors.text.main} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 