import React, { useState, useCallback } from 'react';
import { TeamMemberListPresentation } from './TeamMemberListPresentation';
import { PresentationAdapter } from '@/ui/shared/adapters/PresentationAdapter';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';

interface TeamMember {
  id: string;
  name?: string;
  role: string;
  addedAt?: string;
}

interface TeamMemberListContainerProps {
  // Data
  members: TeamMember[] | undefined;
  isAdmin: boolean;
  isLoading: boolean;
  error: unknown;
  
  // Händelser
  onAddMember: (userId: string, role: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onChangeRole: (memberId: string, role: string) => Promise<void>;
  onRetry?: () => void;
}

/**
 * Container-komponent för TeamMemberList som hanterar affärslogik
 */
export const TeamMemberListContainer: React.FC<TeamMemberListContainerProps> = ({
  members,
  isAdmin,
  isLoading,
  error,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  onRetry,
}) => {
  // Lokalt tillstånd
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addingProgress, setAddingProgress] = useState<ProgressInfo | null>(null);
  
  // Hantera växling av formuläret för att lägga till ny medlem
  const handleToggleAddForm = useCallback(() => {
    setShowAddForm(prev => !prev);
  }, []);
  
  // Hantera tillägg av ny medlem
  const handleAddMember = useCallback(async (userId: string, role: string) => {
    setIsAddingMember(true);
    setAddingProgress({ message: 'Lägger till medlem...', percent: 10 });
    
    try {
      // Uppdatera progress efter en kort fördröjning
      setTimeout(() => {
        setAddingProgress({ message: 'Uppdaterar teammedlemskap...', percent: 50 });
      }, 500);
      
      await onAddMember(userId, role);
      
      setAddingProgress({ message: 'Medlem tillagd!', percent: 100 });
      
      // Återställ formuläret efter framgångsrik tillägg
      setTimeout(() => {
        setIsAddingMember(false);
        setAddingProgress(null);
        setShowAddForm(false);
      }, 1000);
    } catch (error) {
      setAddingProgress({ message: 'Ett fel uppstod', percent: 0 });
      
      // Återställ endast laddningstillståndet 
      setTimeout(() => {
        setIsAddingMember(false);
        setAddingProgress(null);
      }, 1000);
    }
  }, [onAddMember]);
  
  return (
    <PresentationAdapter
      data={members}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      errorContext={{
        domain: 'team',
        operation: 'fetchMembers',
      }}
      emptyState={{
        title: 'Inga medlemmar',
        message: 'Det finns inga medlemmar att visa just nu.',
        actionText: isAdmin ? 'Lägg till medlem' : undefined,
        onAction: isAdmin ? handleToggleAddForm : undefined,
      }}
      renderData={(members) => (
        <TeamMemberListPresentation
          members={members}
          isAdmin={isAdmin}
          isLoading={isLoading}
          isAddingMember={isAddingMember}
          addingProgress={addingProgress}
          showAddForm={showAddForm}
          onAddMember={handleAddMember}
          onRemoveMember={onRemoveMember}
          onChangeRole={onChangeRole}
          onToggleAddForm={handleToggleAddForm}
        />
      )}
    />
  );
}; 