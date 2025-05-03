import { useReducer, useCallback } from 'react';
import { Team, TeamMember, TeamState, TeamRole } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Typer för TeamState
export interface TeamState {
  // Team-data
  team: Team | null;
  teamLoading: boolean;
  teamError: Error | null;
  
  // Medlemsdata
  activeMembers: TeamMember[];
  pendingMembers: TeamMember[];
  membersLoading: boolean;
  membersError: Error | null;
  
  // Inbjudningsdata
  invites: TeamInvite[];
  invitesLoading: boolean;
  invitesError: Error | null;
  
  // Användarens medlemskap
  memberships: Team[];
  
  // UI-tillstånd
  activeTab: 'overview' | 'members' | 'settings' | 'chat';
  showAddMemberModal: boolean;
  showInviteCodeModal: boolean;
  inviteCode: string | null;
  isSubmitting: boolean;
  isGeneratingInvite: boolean;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  team?: {
    id: string;
    name: string;
    profile_image: string | null;
  };
}

// Initial state
const initialTeamState: TeamState = {
  team: null,
  teamLoading: false,
  teamError: null,
  
  activeMembers: [],
  pendingMembers: [],
  membersLoading: false,
  membersError: null,
  
  invites: [],
  invitesLoading: false,
  invitesError: null,
  
  memberships: [],
  
  activeTab: 'overview',
  showAddMemberModal: false,
  showInviteCodeModal: false,
  inviteCode: null,
  isSubmitting: false,
  isGeneratingInvite: false,
};

// Action types
type TeamAction =
  // Team actions
  | { type: 'FETCH_TEAM_START' }
  | { type: 'FETCH_TEAM_SUCCESS'; payload: Team }
  | { type: 'FETCH_TEAM_ERROR'; payload: Error }
  | { type: 'UPDATE_TEAM'; payload: Partial<Team> }
  
  // Members actions
  | { type: 'FETCH_MEMBERS_START' }
  | { type: 'FETCH_MEMBERS_SUCCESS'; payload: { active: TeamMember[], pending: TeamMember[] } }
  | { type: 'FETCH_MEMBERS_ERROR'; payload: Error }
  | { type: 'ADD_MEMBER'; payload: TeamMember }
  | { type: 'REMOVE_MEMBER'; payload: string } // userId
  | { type: 'UPDATE_MEMBER'; payload: { userId: string, updates: Partial<TeamMember> } }
  | { type: 'APPROVE_MEMBER'; payload: string } // userId
  | { type: 'REJECT_MEMBER'; payload: string } // userId
  
  // Invites actions
  | { type: 'FETCH_INVITES_START' }
  | { type: 'FETCH_INVITES_SUCCESS'; payload: TeamInvite[] }
  | { type: 'FETCH_INVITES_ERROR'; payload: Error }
  | { type: 'ACCEPT_INVITE'; payload: string } // inviteId
  | { type: 'DECLINE_INVITE'; payload: string } // inviteId
  | { type: 'SET_INVITE_CODE'; payload: string }
  | { type: 'CLEAR_INVITE_CODE' }
  
  // Memberships actions
  | { type: 'FETCH_MEMBERSHIPS_SUCCESS'; payload: Team[] }
  | { type: 'CANCEL_MEMBERSHIP'; payload: string } // teamId
  
  // UI actions
  | { type: 'SET_ACTIVE_TAB'; payload: TeamState['activeTab'] }
  | { type: 'TOGGLE_ADD_MEMBER_MODAL'; payload?: boolean }
  | { type: 'TOGGLE_INVITE_CODE_MODAL'; payload?: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_GENERATING_INVITE'; payload: boolean }
  
  // Error handling
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_MEMBER_ERROR' }
  | { type: 'CLEAR_INVITE_ERROR' };

// Reducer function
const teamReducer = (state: TeamState, action: TeamAction): TeamState => {
  switch (action.type) {
    // Team actions
    case 'FETCH_TEAM_START':
      return {
        ...state,
        teamLoading: true,
        teamError: null,
      };
      
    case 'FETCH_TEAM_SUCCESS':
      return {
        ...state,
        team: action.payload,
        teamLoading: false,
        teamError: null,
      };
      
    case 'FETCH_TEAM_ERROR':
      return {
        ...state,
        teamLoading: false,
        teamError: action.payload,
      };
      
    case 'UPDATE_TEAM':
      return {
        ...state,
        team: state.team 
          ? { ...state.team, ...action.payload } 
          : null,
      };
      
    // Members actions
    case 'FETCH_MEMBERS_START':
      return {
        ...state,
        membersLoading: true,
        membersError: null,
      };
      
    case 'FETCH_MEMBERS_SUCCESS':
      return {
        ...state,
        activeMembers: action.payload.active,
        pendingMembers: action.payload.pending,
        membersLoading: false,
        membersError: null,
      };
      
    case 'FETCH_MEMBERS_ERROR':
      return {
        ...state,
        membersLoading: false,
        membersError: action.payload,
      };
      
    case 'ADD_MEMBER':
      return {
        ...state,
        activeMembers: [...state.activeMembers, action.payload],
      };
      
    case 'REMOVE_MEMBER': {
      const userId = action.payload;
      return {
        ...state,
        activeMembers: state.activeMembers.filter(m => m.user_id !== userId),
        pendingMembers: state.pendingMembers.filter(m => m.user_id !== userId),
      };
    }
      
    case 'UPDATE_MEMBER': {
      const { userId, updates } = action.payload;
      return {
        ...state,
        activeMembers: state.activeMembers.map(member => 
          member.user_id === userId 
            ? { ...member, ...updates } 
            : member
        ),
      };
    }
      
    case 'APPROVE_MEMBER': {
      const userId = action.payload;
      const memberToApprove = state.pendingMembers.find(m => m.user_id === userId);
      
      if (!memberToApprove) return state;
      
      return {
        ...state,
        activeMembers: [...state.activeMembers, { ...memberToApprove, status: 'active' }],
        pendingMembers: state.pendingMembers.filter(m => m.user_id !== userId),
      };
    }
      
    case 'REJECT_MEMBER': {
      const userId = action.payload;
      return {
        ...state,
        pendingMembers: state.pendingMembers.filter(m => m.user_id !== userId),
      };
    }
      
    // Invites actions
    case 'FETCH_INVITES_START':
      return {
        ...state,
        invitesLoading: true,
        invitesError: null,
      };
      
    case 'FETCH_INVITES_SUCCESS':
      return {
        ...state,
        invites: action.payload,
        invitesLoading: false,
        invitesError: null,
      };
      
    case 'FETCH_INVITES_ERROR':
      return {
        ...state,
        invitesLoading: false,
        invitesError: action.payload,
      };
      
    case 'ACCEPT_INVITE': {
      const inviteId = action.payload;
      return {
        ...state,
        invites: state.invites.filter(invite => invite.id !== inviteId),
      };
    }
      
    case 'DECLINE_INVITE': {
      const inviteId = action.payload;
      return {
        ...state,
        invites: state.invites.filter(invite => invite.id !== inviteId),
      };
    }
      
    case 'SET_INVITE_CODE':
      return {
        ...state,
        inviteCode: action.payload,
      };
      
    case 'CLEAR_INVITE_CODE':
      return {
        ...state,
        inviteCode: null,
      };
      
    // Memberships actions
    case 'FETCH_MEMBERSHIPS_SUCCESS':
      return {
        ...state,
        memberships: action.payload,
      };
      
    case 'CANCEL_MEMBERSHIP': {
      const teamId = action.payload;
      return {
        ...state,
        memberships: state.memberships.filter(team => team.id !== teamId),
      };
    }
      
    // UI actions
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
      
    case 'TOGGLE_ADD_MEMBER_MODAL':
      return {
        ...state,
        showAddMemberModal: action.payload !== undefined 
          ? action.payload 
          : !state.showAddMemberModal,
      };
      
    case 'TOGGLE_INVITE_CODE_MODAL':
      return {
        ...state,
        showInviteCodeModal: action.payload !== undefined 
          ? action.payload 
          : !state.showInviteCodeModal,
      };
      
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };
      
    case 'SET_GENERATING_INVITE':
      return {
        ...state,
        isGeneratingInvite: action.payload,
      };
      
    // Error handling
    case 'CLEAR_ERROR':
      return {
        ...state,
        teamError: null,
        membersError: null,
        invitesError: null,
      };
      
    case 'CLEAR_MEMBER_ERROR':
      return {
        ...state,
        membersError: null,
      };
      
    case 'CLEAR_INVITE_ERROR':
      return {
        ...state,
        invitesError: null,
      };
      
    default:
      return state;
  }
};

/**
 * Hook för hantering av team-state med useReducer
 * 
 * Denna hook hanterar allt team-relaterat tillstånd och erbjuder
 * hjälpfunktioner för att göra dispatch mer läsbar för komponenter.
 */
export function useTeamState(initialState: Partial<TeamState> = {}) {
  const [state, dispatch] = useReducer(
    teamReducer, 
    { ...initialTeamState, ...initialState }
  );
  
  // Hjälpfunktioner för att göra dispatch mer läsbar för komponenter
  
  // Datahämtning
  const fetchTeam = useCallback((team: Team) => {
    dispatch({ type: 'FETCH_TEAM_SUCCESS', payload: team });
  }, []);
  
  const startFetchingTeam = useCallback(() => {
    dispatch({ type: 'FETCH_TEAM_START' });
  }, []);
  
  const setTeamError = useCallback((error: Error) => {
    dispatch({ type: 'FETCH_TEAM_ERROR', payload: error });
  }, []);
  
  const fetchMembers = useCallback((active: TeamMember[], pending: TeamMember[]) => {
    dispatch({ 
      type: 'FETCH_MEMBERS_SUCCESS', 
      payload: { active, pending } 
    });
  }, []);
  
  const startFetchingMembers = useCallback(() => {
    dispatch({ type: 'FETCH_MEMBERS_START' });
  }, []);
  
  const setMembersError = useCallback((error: Error) => {
    dispatch({ type: 'FETCH_MEMBERS_ERROR', payload: error });
  }, []);
  
  const fetchInvites = useCallback((invites: TeamInvite[]) => {
    dispatch({ type: 'FETCH_INVITES_SUCCESS', payload: invites });
  }, []);
  
  const startFetchingInvites = useCallback(() => {
    dispatch({ type: 'FETCH_INVITES_START' });
  }, []);
  
  const setInvitesError = useCallback((error: Error) => {
    dispatch({ type: 'FETCH_INVITES_ERROR', payload: error });
  }, []);
  
  const fetchMemberships = useCallback((memberships: Team[]) => {
    dispatch({ type: 'FETCH_MEMBERSHIPS_SUCCESS', payload: memberships });
  }, []);
  
  // Team-uppdateringar
  const updateTeam = useCallback((teamUpdates: Partial<Team>) => {
    dispatch({ type: 'UPDATE_TEAM', payload: teamUpdates });
  }, []);
  
  const setInviteCode = useCallback((code: string) => {
    dispatch({ type: 'SET_INVITE_CODE', payload: code });
  }, []);
  
  const clearInviteCode = useCallback(() => {
    dispatch({ type: 'CLEAR_INVITE_CODE' });
  }, []);
  
  // UI-kontroller
  const setActiveTab = useCallback((tab: TeamState['activeTab']) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);
  
  const toggleAddMemberModal = useCallback((show?: boolean) => {
    dispatch({ type: 'TOGGLE_ADD_MEMBER_MODAL', payload: show });
  }, []);
  
  const toggleInviteCodeModal = useCallback((show?: boolean) => {
    dispatch({ type: 'TOGGLE_INVITE_CODE_MODAL', payload: show });
  }, []);
  
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting });
  }, []);
  
  const setGeneratingInvite = useCallback((isGenerating: boolean) => {
    dispatch({ type: 'SET_GENERATING_INVITE', payload: isGenerating });
  }, []);
  
  // Medlemshantering
  const addMember = useCallback((member: TeamMember) => {
    dispatch({ type: 'ADD_MEMBER', payload: member });
  }, []);
  
  const removeMember = useCallback((userId: string) => {
    dispatch({ type: 'REMOVE_MEMBER', payload: userId });
  }, []);
  
  const updateMember = useCallback((userId: string, updates: Partial<TeamMember>) => {
    dispatch({ 
      type: 'UPDATE_MEMBER', 
      payload: { userId, updates } 
    });
  }, []);
  
  const approveMember = useCallback((userId: string) => {
    dispatch({ type: 'APPROVE_MEMBER', payload: userId });
  }, []);
  
  const rejectMember = useCallback((userId: string) => {
    dispatch({ type: 'REJECT_MEMBER', payload: userId });
  }, []);
  
  // Inbjudningshantering
  const acceptInvite = useCallback((inviteId: string) => {
    dispatch({ type: 'ACCEPT_INVITE', payload: inviteId });
  }, []);
  
  const declineInvite = useCallback((inviteId: string) => {
    dispatch({ type: 'DECLINE_INVITE', payload: inviteId });
  }, []);
  
  const cancelMembership = useCallback((teamId: string) => {
    dispatch({ type: 'CANCEL_MEMBERSHIP', payload: teamId });
  }, []);
  
  // Felhantering
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);
  
  const clearMemberError = useCallback(() => {
    dispatch({ type: 'CLEAR_MEMBER_ERROR' });
  }, []);
  
  const clearInviteError = useCallback(() => {
    dispatch({ type: 'CLEAR_INVITE_ERROR' });
  }, []);
  
  return {
    // State
    state,
    
    // Rå dispatcher (för avancerade användningsfall)
    dispatch,
    
    // Datahämtning
    fetchTeam,
    startFetchingTeam,
    setTeamError,
    fetchMembers,
    startFetchingMembers,
    setMembersError,
    fetchInvites,
    startFetchingInvites,
    setInvitesError,
    fetchMemberships,
    
    // Team-uppdateringar
    updateTeam,
    setInviteCode,
    clearInviteCode,
    
    // UI-kontroller
    setActiveTab,
    toggleAddMemberModal,
    toggleInviteCodeModal,
    setSubmitting,
    setGeneratingInvite,
    
    // Medlemshantering
    addMember,
    removeMember,
    updateMember,
    approveMember,
    rejectMember,
    
    // Inbjudningshantering
    acceptInvite,
    declineInvite,
    cancelMembership,
    
    // Felhantering
    clearError,
    clearMemberError,
    clearInviteError,
  };
}

export default useTeamState; 