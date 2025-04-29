import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/services/supabaseClient';

export function useUnreadMessages() {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.team?.id) return;

    // Load initial unread count
    loadUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('team_chat_unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${user.team.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.team?.id, lastReadTime]);

  const loadUnreadCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_message_count', {
          team_id: user?.team?.id
        });

      if (error) throw error;
      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const markAsRead = async () => {
    try {
      const { error } = await supabase
        .rpc('mark_messages_as_read');

      if (error) throw error;
      
      // After marking messages as read, reload the unread count
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    unreadCount,
    markAsRead,
  };
}