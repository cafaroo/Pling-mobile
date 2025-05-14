import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { X, Bell } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

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

export default function NotificationPanel({ notifications, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    // Markera som läst
    if (!notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
    }

    // Navigera till rätt plats baserat på action_url
    if (notification.action_url) {
      router.push(notification.action_url);
    }

    onClose();
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false);
  };

  return (
    <View className="absolute right-0 top-12 w-80 bg-gray-900 rounded-lg shadow-xl border border-gray-700 max-h-[80vh] z-50">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <Text className="text-lg font-semibold text-white">Notifikationer</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={markAllAsRead}
            className="px-2 py-1 rounded bg-gray-700"
          >
            <Text className="text-sm text-white">Markera alla som lästa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <X size={20} className="text-white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="max-h-96">
        {notifications.length === 0 ? (
          <View className="p-4">
            <Text className="text-gray-400 text-center">Inga notifikationer</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handleNotificationClick(notification)}
              className={`p-4 border-b border-gray-700 flex-row items-center gap-4 ${
                !notification.read ? 'bg-blue-800' : 'bg-gray-800'
              }`}
            >
              <Bell size={24} className="text-yellow-400" />
              <View>
                <Text className="font-semibold mb-1 text-white">{notification.title}</Text>
                <Text className="text-gray-300 text-sm mb-2">{notification.message}</Text>
                <Text className="text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: sv,
                  })}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
} 