// User types
export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  team_id: string | null;
  created_at: string;
};

// Chat types
export type ChatUser = {
  id: string;
  username: string;
  avatar_url?: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  user: ChatUser;
  created_at: string;
  reply_count: number;
  parent_id?: string;
  thread_id?: string;
  replies?: ChatMessage[];
  reactions?: { [emoji: string]: ChatUser[] };
};

// Sales types
export type Sale = {
  id: string;
  userId?: string;
  amount: number;
  product?: string;
  comment?: string;
  createdAt?: string;
};

// Leaderboard types
export type LeaderboardEntry = {
  id: string;
  name: string;
  amount: number;
  avatarUrl?: string;
  positionChange: number;
};

// Team types
export type TeamRanking = {
  teamId: string;
  teamName: string;
  rank: number;
  totalAmount: number;
  positionChange: number;
};

// Competition types
export type Competition = {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team';
  startDate: string;
  endDate: string;
  targetValue: number;
  currentValue: number;
  currentPosition: number;
  totalParticipants: number;
  prize?: string;
  category?: CompetitionCategory;
  status: 'draft' | 'upcoming' | 'active' | 'ended';
  imageUrl?: string;
};

export type CompetitionCategory = {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
};

export type CompetitionDetails = Competition & {
  participantId?: string;
  positionChange: number;
};

// User statistics
export type UserStats = {
  weekAmount: number;
  monthAmount: number;
  largestSale: number;
  totalSales: number;
  level: number;
};

// Team types
export type Team = {
  id: string;
  name: string;
  created_at: string;
};

export type TeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: 'member' | 'leader' | 'owner';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  user?: User;
  createdAt: string;
};

// Organization types
export type Organization = {
  id: string;
  name: string;
  role: 'member' | 'admin';
  teamCount: number;
  createdAt: string;
  updatedAt: string;
};

type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: 'member' | 'admin';
  user?: User;
  createdAt: string;
};

// Team invitation type
export type TeamInvitation = {
  id: string;
  teamId: string;
  email: string;
  role: 'member' | 'leader' | 'owner';
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
};

// Badge types
export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  dateEarned: string;
};

// Goal types
export type GoalType = 'sales_amount' | 'sales_count';
export type GoalPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'failed' | 'archived';
export type GoalAssigneeType = 'team' | 'individual';

export type Goal = {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  period: GoalPeriod;
  status: GoalStatus;
  userId?: string;
  teamId?: string;
  assigneeId?: string; // ID of the team member this goal is assigned to
  assigneeType?: GoalAssigneeType; // Whether this is a team or individual goal
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  milestones?: GoalMilestone[];
  progress: number;
  assigneeName?: string; // Name of the team member this goal is assigned to
};

export type GoalMilestone = {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  reward?: string;
  isCompleted: boolean;
  completedAt?: string;
};

export interface NotificationSettings {
  new_member: boolean;
  member_left: boolean;
  goal_updates: boolean;
  competition_updates: boolean;
}

export interface RoleSettings {
  owner: {
    canInviteMembers: boolean;
    canManageGoals: boolean;
    canManageCompetitions: boolean;
  };
  leader: {
    canInviteMembers: boolean;
    canManageGoals: boolean;
    canManageCompetitions: boolean;
  };
  member: {
    canInviteMembers: boolean;
    canManageGoals: boolean;
    canManageCompetitions: boolean;
  };
}

export type MessageType = 'text' | 'image' | 'file' | 'mixed';

export type MessageAttachment = {
  type: 'image' | 'file';
  url: string;
  filename?: string;
  size?: number;
  mime_type?: string;
};

export type Message = {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  team_id: string;
  parent_id?: string;
  thread_id?: string;
  reply_count?: number;
  user: {
    name: string | null;
    avatar_url: string | null;
  };
  reactions?: {
    id: string;
    emoji: string;
    user_id: string;
    created_at: string;
  }[];
};
