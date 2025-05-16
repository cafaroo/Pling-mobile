import React, { useState, useMemo } from 'react';
import { MemberCardPresentation } from './MemberCardPresentation';

interface TeamMember {
  id: string;
  name?: string;
  role: string;
  addedAt?: string;
}

interface MemberCardContainerProps {
  /** Teammedlemmen att visa */
  member: TeamMember;
  /** Om nuvarande användare är admin */
  isAdmin: boolean;
  /** Callback för att ta bort medlem */
  onRemove?: (memberId: string) => void;
  /** Callback för att ändra roll */
  onRoleChange?: (memberId: string, role: string) => void;
}

/**
 * Container-komponent för MemberCard som hanterar affärslogik
 */
export const MemberCardContainer: React.FC<MemberCardContainerProps> = ({
  member,
  isAdmin,
  onRemove,
  onRoleChange,
}) => {
  // Tillstånd
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  
  // Rollalternativ
  const roles = useMemo(() => [
    { id: 'admin', label: 'Admin' },
    { id: 'member', label: 'Medlem' }
  ], []);
  
  // Formatera och hantera data
  const displayName = member.name || `Användare (${member.id})`;
  
  const memberSince = useMemo(() => {
    return member.addedAt 
      ? new Date(member.addedAt).toLocaleDateString('sv-SE')
      : 'Okänd tidpunkt';
  }, [member.addedAt]);
  
  // Händelsehanterare
  const handleRoleChange = (role: string) => {
    setShowRoleOptions(false);
    if (onRoleChange) {
      onRoleChange(member.id, role);
    }
  };
  
  const handleToggleRoleOptions = () => {
    setShowRoleOptions(prev => !prev);
  };
  
  const handleRemove = () => {
    if (onRemove) {
      onRemove(member.id);
    }
  };
  
  return (
    <MemberCardPresentation
      displayName={displayName}
      memberSince={memberSince}
      memberRole={member.role}
      isAdmin={isAdmin}
      showRoleOptions={showRoleOptions}
      roles={roles}
      onRoleChange={handleRoleChange}
      onToggleRoleOptions={handleToggleRoleOptions}
      onRemove={handleRemove}
    />
  );
}; 