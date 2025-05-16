import React, { useState, useCallback, useMemo } from 'react';
import { TeamPermissionManagerPresentation } from './TeamPermissionManagerPresentation';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';
import { TeamRolePermission } from '@/domain/team/value-objects/TeamRolePermission';
import { Team } from '@/domain/team/entities/Team';
import { TeamMember } from '@/domain/team/entities/TeamMember';

interface TeamPermissionManagerContainerProps {
  team: Team;
  member?: TeamMember;
  onRoleChange?: (role: TeamRolePermission) => void;
  onCustomPermissionsChange?: (permissions: TeamPermission[]) => void;
  allowCustomPermissions?: boolean;
  readOnly?: boolean;
}

/**
 * Container-komponent för TeamPermissionManager som innehåller affärslogik
 */
export const TeamPermissionManagerContainer: React.FC<TeamPermissionManagerContainerProps> = ({
  team,
  member,
  onRoleChange,
  onCustomPermissionsChange,
  allowCustomPermissions = true,
  readOnly = false,
}) => {
  // State
  const [selectedRole, setSelectedRole] = useState<TeamRolePermission | undefined>(
    member ? TeamRolePermission.create(member.role, []) : undefined
  );
  const [customPermissions, setCustomPermissions] = useState<TeamPermission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  
  // Lista över alla behörigheter
  const allPermissions = useMemo(() => TeamPermission.createAll(), []);
  
  // Behörigheter från vald roll
  const rolePermissions = useMemo(() => {
    return selectedRole ? selectedRole.permissionObjects : [];
  }, [selectedRole]);
  
  // Alla effektiva behörigheter (roll + anpassade)
  const effectivePermissions = useMemo(() => {
    const permissions = [...rolePermissions];
    
    // Lägg till anpassade behörigheter som inte redan finns i rollbehörigheter
    customPermissions.forEach(permission => {
      if (!permissions.some(p => p.name === permission.name)) {
        permissions.push(permission);
      }
    });
    
    return permissions;
  }, [rolePermissions, customPermissions]);
  
  // Filtrerade behörigheter baserat på sökfråga
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) {
      return allPermissions;
    }
    
    const query = searchQuery.toLowerCase();
    return allPermissions.filter(permission => 
      permission.name.toLowerCase().includes(query) || 
      permission.description.toLowerCase().includes(query)
    );
  }, [allPermissions, searchQuery]);
  
  // Kontrollera om en behörighet är aktiv (från roll eller anpassad)
  const isPermissionActive = useCallback((permission: TeamPermission) => {
    return effectivePermissions.some(p => p.name === permission.name);
  }, [effectivePermissions]);
  
  // Hantera växling av behörighet
  const handleTogglePermission = useCallback((permission: TeamPermission) => {
    if (readOnly) return;
    
    // Kontrollera om behörigheten kommer från en roll
    const isFromRole = rolePermissions.some(p => p.name === permission.name);
    
    if (isFromRole) {
      // Kan inte inaktivera rollbehörigheter direkt
      return;
    }
    
    // Växla anpassad behörighet
    let updatedPermissions: TeamPermission[];
    
    if (customPermissions.some(p => p.name === permission.name)) {
      // Ta bort behörighet
      updatedPermissions = customPermissions.filter(p => p.name !== permission.name);
    } else {
      // Lägg till behörighet
      updatedPermissions = [...customPermissions, permission];
    }
    
    setCustomPermissions(updatedPermissions);
    onCustomPermissionsChange && onCustomPermissionsChange(updatedPermissions);
  }, [customPermissions, rolePermissions, readOnly, onCustomPermissionsChange]);
  
  // Hantera val av roll
  const handleRoleSelect = useCallback((role: TeamRolePermission) => {
    if (readOnly) return;
    
    setSelectedRole(role);
    onRoleChange && onRoleChange(role);
  }, [readOnly, onRoleChange]);
  
  // Hantera växling av tab
  const handleTabChange = useCallback((tab: 'roles' | 'permissions') => {
    setActiveTab(tab);
  }, []);
  
  // Hantera sökfråga
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // Hantera visning av alla behörigheter
  const handleToggleShowAllPermissions = useCallback(() => {
    setShowAllPermissions(prev => !prev);
  }, []);
  
  return (
    <TeamPermissionManagerPresentation
      teamName={team.name}
      memberUserId={member?.userId}
      readOnly={readOnly}
      selectedRole={selectedRole}
      customPermissions={customPermissions}
      allPermissions={allPermissions}
      rolePermissions={rolePermissions}
      effectivePermissions={effectivePermissions}
      filteredPermissions={filteredPermissions}
      searchQuery={searchQuery}
      showAllPermissions={showAllPermissions}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onSearchChange={handleSearchChange}
      onTogglePermission={handleTogglePermission}
      onRoleSelect={handleRoleSelect}
      onToggleShowAllPermissions={handleToggleShowAllPermissions}
      isPermissionActive={isPermissionActive}
    />
  );
}; 