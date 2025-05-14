import { Team, TeamMember } from '@/types';

/**
 * TeamState-typer och reducer för komplex state-hantering i team-komponenter
 */

// TeamInvite-interface för inbjudningar
export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  team?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
  };
}

// TeamState typdefiniton
export interface TeamState {
  // Data
  team: Team | null;
  members: TeamMember[];
  pendingMembers: TeamMember[];
  pendingInvites: TeamInvite[];
  pendingMemberships: Team[];
  inviteCode: string | null;
  
  // UI-state
  isLoading: boolean;
  isLoadingMembers: boolean;
  isLoadingInvites: boolean;
  isSubmitting: boolean;
  isGeneratingInvite: boolean;
  
  // Visningslägen
  activeTab: 'members' | 'settings' | 'invites';
  showAddMemberModal: boolean;
  showInviteCodeModal: boolean;
  
  // Felhantering
  error: Error | null;
  memberError: Error | null;
  inviteError: Error | null;
}

// Initial state
export const initialTeamState: TeamState = {
  // Data
  team: null,
  members: [],
  pendingMembers: [],
  pendingInvites: [],
  pendingMemberships: [],
  inviteCode: null,
  
  // UI-state
  isLoading: false,
  isLoadingMembers: false,
  isLoadingInvites: false,
  isSubmitting: false,
  isGeneratingInvite: false,
  
  // Visningslägen
  activeTab: 'members',
  showAddMemberModal: false,
  showInviteCodeModal: false,
  
  // Felhantering
  error: null,
  memberError: null,
  inviteError: null,
};

// Action-typer med diskriminerande union
export type TeamAction =
  // Data-relaterade actions
  | { type: 'FETCH_TEAM_START' }
  | { type: 'FETCH_TEAM_SUCCESS'; payload: Team }
  | { type: 'FETCH_TEAM_ERROR'; payload: Error }
  
  | { type: 'FETCH_MEMBERS_START' }
  | { type: 'FETCH_MEMBERS_SUCCESS'; payload: { active: TeamMember[], pending: TeamMember[] } }
  | { type: 'FETCH_MEMBERS_ERROR'; payload: Error }
  
  | { type: 'FETCH_INVITES_START' }
  | { type: 'FETCH_INVITES_SUCCESS'; payload: TeamInvite[] }
  | { type: 'FETCH_INVITES_ERROR'; payload: Error }
  
  | { type: 'FETCH_MEMBERSHIPS_SUCCESS'; payload: Team[] }
  
  | { type: 'UPDATE_TEAM'; payload: Partial<Team> }
  | { type: 'SET_INVITE_CODE'; payload: string }
  | { type: 'CLEAR_INVITE_CODE' }
  
  // UI-relaterade actions
  | { type: 'SET_ACTIVE_TAB'; payload: TeamState['activeTab'] }
  | { type: 'TOGGLE_ADD_MEMBER_MODAL'; payload?: boolean }
  | { type: 'TOGGLE_INVITE_CODE_MODAL'; payload?: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_GENERATING_INVITE'; payload: boolean }
  
  // Medlemshanterings-actions
  | { type: 'ADD_MEMBER'; payload: TeamMember }
  | { type: 'REMOVE_MEMBER'; payload: string }  // userId
  | { type: 'UPDATE_MEMBER'; payload: { userId: string; updates: Partial<TeamMember> } }
  | { type: 'APPROVE_MEMBER'; payload: string } // userId
  | { type: 'REJECT_MEMBER'; payload: string }  // userId
  
  // Inbjudningshanterings-actions
  | { type: 'ACCEPT_INVITE'; payload: string }  // inviteId
  | { type: 'DECLINE_INVITE'; payload: string }  // inviteId
  | { type: 'CANCEL_MEMBERSHIP'; payload: string }  // teamId
  
  // Felhantering
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_MEMBER_ERROR' }
  | { type: 'CLEAR_INVITE_ERROR' };

// Reducer för teamState
export function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    // Data-relaterade actions
    case 'FETCH_TEAM_START':
      return { ...state, isLoading: true, error: null };
    
    case 'FETCH_TEAM_SUCCESS':
      return { 
        ...state, 
        isLoading: false, 
        team: action.payload,
        error: null 
      };
    
    case 'FETCH_TEAM_ERROR':
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload 
      };
    
    case 'FETCH_MEMBERS_START':
      return { ...state, isLoadingMembers: true, memberError: null };
    
    case 'FETCH_MEMBERS_SUCCESS':
      return { 
        ...state, 
        isLoadingMembers: false, 
        members: action.payload.active,
        pendingMembers: action.payload.pending,
        memberError: null 
      };
    
    case 'FETCH_MEMBERS_ERROR':
      return { 
        ...state, 
        isLoadingMembers: false, 
        memberError: action.payload 
      };
    
    case 'FETCH_INVITES_START':
      return { ...state, isLoadingInvites: true, inviteError: null };
    
    case 'FETCH_INVITES_SUCCESS':
      return { 
        ...state, 
        isLoadingInvites: false, 
        pendingInvites: action.payload,
        inviteError: null 
      };
    
    case 'FETCH_INVITES_ERROR':
      return { 
        ...state, 
        isLoadingInvites: false, 
        inviteError: action.payload 
      };
    
    case 'FETCH_MEMBERSHIPS_SUCCESS':
      return { 
        ...state, 
        pendingMemberships: action.payload 
      };
    
    case 'UPDATE_TEAM':
      return { 
        ...state, 
        team: state.team ? { ...state.team, ...action.payload } : null 
      };
    
    case 'SET_INVITE_CODE':
      return { ...state, inviteCode: action.payload, isGeneratingInvite: false };
    
    case 'CLEAR_INVITE_CODE':
      return { ...state, inviteCode: null };
    
    // UI-relaterade actions
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'TOGGLE_ADD_MEMBER_MODAL':
      return { 
        ...state, 
        showAddMemberModal: action.payload !== undefined 
          ? action.payload 
          : !state.showAddMemberModal 
      };
    
    case 'TOGGLE_INVITE_CODE_MODAL':
      return { 
        ...state, 
        showInviteCodeModal: action.payload !== undefined 
          ? action.payload 
          : !state.showInviteCodeModal 
      };
    
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    
    case 'SET_GENERATING_INVITE':
      return { ...state, isGeneratingInvite: action.payload };
    
    // Medlemshanterings-actions
    case 'ADD_MEMBER':
      return { 
        ...state, 
        members: [...state.members, action.payload] 
      };
    
    case 'REMOVE_MEMBER':
      return { 
        ...state, 
        members: state.members.filter(member => member.user_id !== action.payload) 
      };
    
    case 'UPDATE_MEMBER':
      return { 
        ...state, 
        members: state.members.map(member => 
          member.user_id === action.payload.userId 
            ? { ...member, ...action.payload.updates } 
            : member
        ) 
      };
    
    case 'APPROVE_MEMBER':
      // Flytta från pendingMembers till members och ändra status
      const approvedMember = state.pendingMembers.find(
        member => member.user_id === action.payload
      );
      
      if (!approvedMember) return state;
      
      return { 
        ...state, 
        members: [...state.members, { ...approvedMember, status: 'active' }],
        pendingMembers: state.pendingMembers.filter(
          member => member.user_id !== action.payload
        )
      };
    
    case 'REJECT_MEMBER':
      return { 
        ...state, 
        pendingMembers: state.pendingMembers.filter(
          member => member.user_id !== action.payload
        ) 
      };
    
    // Inbjudningshanterings-actions
    case 'ACCEPT_INVITE':
      return { 
        ...state, 
        pendingInvites: state.pendingInvites.filter(
          invite => invite.id !== action.payload
        ) 
      };
    
    case 'DECLINE_INVITE':
      return { 
        ...state, 
        pendingInvites: state.pendingInvites.filter(
          invite => invite.id !== action.payload
        ) 
      };
    
    case 'CANCEL_MEMBERSHIP':
      return { 
        ...state, 
        pendingMemberships: state.pendingMemberships.filter(
          team => team.id !== action.payload
        ) 
      };
    
    // Felhantering
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'CLEAR_MEMBER_ERROR':
      return { ...state, memberError: null };
    
    case 'CLEAR_INVITE_ERROR':
      return { ...state, inviteError: null };
    
    default:
      return state;
  }
} 