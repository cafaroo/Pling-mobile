import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy, Crown, Bell, Clock } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { CompetitionNotification } from '@/types/competition';
import Card from '@/components/ui/Card';
import { format } from 'date-fns';

type NotificationsListProps = {
  notifications: CompetitionNotification[];
  onNotificationPress?: (notification: CompetitionNotification) => void;
  style?: object;
};

export default function NotificationsList({ 
  notifications, 
  onNotificationPress,
  style 
}: NotificationsListProps) {
  const { colors } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return Trophy;
      case 'rank_change':
        return Crown;
      case 'reminder':
        return Clock;
      default:
        return Bell;
    }
  };

  if (notifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          No notifications yet
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {notifications.map((notification) => {
        const Icon = getIcon(notification.type);
        
        return (
          <TouchableOpacity
            key={notification.id}
            onPress={() => onNotificationPress?.(notification)}
            activeOpacity={0.8}
          >
            <Card style={[
              styles.notificationCard,
              !notification.read && { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
            ]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary.light }]}>
                <Icon color={colors.accent.yellow} size={20} />
              </View>
              
              <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text.main }]}>
                  {notification.title}
                </Text>
                <Text style={[styles.message, { color: colors.text.light }]}>
                  {notification.message}
                </Text>
                <Text style={[styles.time, { color: colors.neutral[400] }]}>
                  {format(new Date(notification.createdAt), 'MMM d, HH:mm')}
                </Text>
              </View>

              {!notification.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.accent.yellow }]} />
              )}
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
});