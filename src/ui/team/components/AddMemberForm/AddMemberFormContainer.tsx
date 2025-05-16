import React, { useState } from 'react';
import { AddMemberFormPresentation } from './AddMemberFormPresentation';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';

interface AddMemberFormContainerProps {
  /** Callback när formuläret skickas */
  onSubmit: (userId: string, role: string) => void;
  /** Om formuläret håller på att skickas */
  isLoading?: boolean;
  /** Laddningsprogressinformation */
  progress?: ProgressInfo | null;
}

/**
 * Container-komponent för att lägga till en teammedlem
 * Innehåller affärslogik och tillstånd
 */
export const AddMemberFormContainer: React.FC<AddMemberFormContainerProps> = ({
  onSubmit,
  isLoading,
  progress,
}) => {
  // Tillstånd
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  
  // Validera och skicka formuläret
  const handleSubmit = () => {
    // Validering
    if (!userId.trim()) {
      setError('Användare-ID är obligatoriskt');
      return;
    }
    
    // Återställ fel
    setError(null);
    
    // Anropa callback
    onSubmit(userId, role);
  };
  
  // Hantera input-ändringar
  const handleUserIdChange = (value: string) => {
    setUserId(value);
    // Rensa felmeddelande när användaren börjar skriva
    if (error) {
      setError(null);
    }
  };
  
  // Hantera rolle-ändringar
  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole);
  };
  
  return (
    <AddMemberFormPresentation
      userId={userId}
      role={role}
      error={error}
      isLoading={isLoading}
      progress={progress}
      onUserIdChange={handleUserIdChange}
      onRoleChange={handleRoleChange}
      onSubmit={handleSubmit}
    />
  );
}; 