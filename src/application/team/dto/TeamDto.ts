export interface TeamMemberDto {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface TeamInvitationDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  respondedAt?: string;
}

export interface TeamDto {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMemberDto[];
  invitations: TeamInvitationDto[];
  createdAt: string;
  updatedAt: string;
} 