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
    if (!user?.team?.id) return;

    try {
      // Get last read time from database, using maybeSingle() to handle no rows
      const { data: readTime } = await supabase
        .from('team_message_reads')
        .select('last_read_at')
        .eq('user_id', user.id)
        .eq('team_id', user.team.id)
        .maybeSingle();

      // If no read time exists, use epoch time as default
      const lastRead = readTime?.last_read_at || new Date(0).toISOString();
      setLastReadTime(lastRead);

      // Get unread count
      const { count, error } = await supabase
        .from('team_messages')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', user.team.id)
        .gt('created_at', lastRead)
        .neq('user_id', user.id); // Don't count own messages

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      // Set default values on error
      setUnreadCount(0);
      setLastReadTime(new Date(0).toISOString());
    }
  };

  const markAsRead = async () => {
    if (!user?.team?.id) return;

    try {
      const now = new Date().toISOString();

      // Update or insert read timestamp
      const { error } = await supabase
        .from('team_message_reads')
        .upsert({
          user_id: user.id,
          team_id: user.team.id,
          last_read_at: now,
        });

      if (error) throw error;

      setLastReadTime(now);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    unreadCount,
    markAsRead,
  };
}