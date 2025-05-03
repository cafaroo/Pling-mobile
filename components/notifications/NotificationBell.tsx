import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import NotificationPanel from './NotificationPanel';
import { useTheme } from '@/context/ThemeContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  priority: string;
  action_url?: string;
  action_label?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Hämta initiala notifikationer
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    };

    fetchNotifications();

    // Prenumerera på nya notifikationer
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new as Notification : n))
            );
            if ((payload.new as Notification).read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowPanel(!showPanel)}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        <View style={styles.bellContainer}>
          <Bell 
            size={24} 
            color={colors.text.light}
            strokeWidth={2}
          />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={[
                styles.badgeText, 
                { color: colors.text.main }
              ]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {showPanel && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowPanel(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    padding: 8, // Större tryckyta för bättre tillgänglighet
  },
  bellContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 