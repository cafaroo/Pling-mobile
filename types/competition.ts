// Competition reward types
type CompetitionRewardType = 'milestone' | 'rank' | 'completion';
type CompetitionConditionType = 'value' | 'percentage' | 'rank';
type CompetitionRewardValueType = 'badge' | 'points' | 'custom';

export interface CompetitionReward {
  id: string;
  competitionId: string;
  title: string;
  description?: string;
  type: CompetitionRewardType;
  conditionType: CompetitionConditionType;
  conditionValue: number;
  rewardType: CompetitionRewardValueType;
  rewardData: Record<string, any>;
  createdAt: string;
}

export interface CompetitionAchievement {
  id: string;
  participantId: string;
  rewardId: string;
  achievedAt: string;
  progress: number;
  completed: boolean;
  metadata: Record<string, any>;
}

export interface CompetitionNotification {
  id: string;
  competitionId: string;
  participantId: string;
  type: 'milestone' | 'rank_change' | 'achievement' | 'reminder';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}