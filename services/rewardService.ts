import { supabase } from './supabaseClient';
import { CompetitionReward, CompetitionAchievement, CompetitionNotification } from '@/types/competition';

// Get rewards for a competition
export const getCompetitionRewards = async (competitionId: string): Promise<CompetitionReward[]> => {
  try {
    const { data, error } = await supabase
      .from('competition_rewards')
      .select('*')
      .eq('competition_id', competitionId)
      .order('condition_value', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting competition rewards:', error);
    return [];
  }
};

// Get achievements for a participant
export const getParticipantAchievements = async (participantId: string): Promise<CompetitionAchievement[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_participant_achievements', { participant_id: participantId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting participant achievements:', error);
    return [];
  }
};

// Get notifications for a participant
const getParticipantNotifications = async (
  participantId: string,
  unreadOnly = false
): Promise<CompetitionNotification[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_participant_notifications', {
        participant_id: participantId,
        unread_only: unreadOnly
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting participant notifications:', error);
    return [];
  }
};

// Mark notification as read
const markNotificationRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('mark_notification_read', { notification_id: notificationId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};