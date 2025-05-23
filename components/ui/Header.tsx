import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Video as LucideIcon, ChevronLeft } from 'lucide-react-native';
import NotificationBell from '../notifications/NotificationBell';

type HeaderProps = {
  title: string;
  icon?: LucideIcon;
  onBackPress?: () => void;
  leftIcon?: LucideIcon;
  onLeftIconPress?: () => void;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  showNotifications?: boolean;
};

export default function Header({ 
  title, 
  icon: Icon, 
  onBackPress,
  leftIcon: LeftIcon,
  onLeftIconPress,
  rightIcon: RightIcon, 
  onRightIconPress,
  showNotifications = true
}: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        {onBackPress && (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.neutral[500] }]}
            onPress={onBackPress}
          >
            <ChevronLeft size={20} color={colors.text.light} />
          </TouchableOpacity>
        )}
        {!onBackPress && LeftIcon && onLeftIconPress && (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.neutral[500] }]}
            onPress={onLeftIconPress}
          >
            <LeftIcon size={20} color={colors.text.light} />
          </TouchableOpacity>
        )}
        {Icon && (
          <Icon color={colors.accent.yellow} size={24} style={styles.icon} />
        )}
        <Text style={[styles.title, { color: colors.text.main }]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.rightContainer}>
        {showNotifications && (
          <View style={styles.notificationContainer}>
            <NotificationBell />
          </View>
        )}
        {RightIcon && onRightIconPress && (
          <TouchableOpacity
            style={[styles.rightButton, { borderColor: colors.neutral[500] }]}
            onPress={onRightIconPress}
          >
            <RightIcon size={20} color={colors.text.light} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  icon: {
    marginRight: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationContainer: {
    marginRight: 4,
  },
  rightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});