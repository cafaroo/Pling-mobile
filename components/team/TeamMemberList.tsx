import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TeamMember, TeamRole } from '@/types/team';
import { teamService } from '@/services/teamService';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MemberItem } from './MemberItem';
import { useTeamMutations } from '@/hooks/useTeamMutations';

// Basinterface för gemensamma props
interface TeamMemberListBaseProps {
  currentUserRole: TeamRole;
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showRoleBadges?: boolean;
  showStatusBadges?: boolean;
  onMemberSelect?: (member: TeamMember) => void;
}

// Interface för användning med React Query
interface TeamMemberListQueryProps extends TeamMemberListBaseProps {
  teamId: string;
  members?: never; // Förhindra användning av både teamId och members
  onRemoveMember?: never;
  onPromoteMember?: never;
}

// Interface för manuell hantering av medlemmar
interface TeamMemberListManualProps extends TeamMemberListBaseProps {
  teamId?: never; // Förhindrar användning av både teamId och members
  members: TeamMember[];
  onRemoveMember?: (userId: string) => void;
  onPromoteMember?: (userId: string, newRole: TeamRole) => void;
}

// Diskriminerande union-typ
type TeamMemberListProps = TeamMemberListQueryProps | TeamMemberListManualProps;

// Typvakter för att verifiera vilken sorts props vi har
const isQueryMode = (props: TeamMemberListProps): props is TeamMemberListQueryProps => {
  return !!props.teamId;
};

export const TeamMemberList = (props: TeamMemberListProps) => {
  const { 
    currentUserRole,
    variant = 'default',
    showRoleBadges = true,
    showStatusBadges = true,
    onMemberSelect
  } = props;
  
  const { colors } = useTheme();
  const { updateMemberRole, removeMember, updateMemberStatus } = useTeamMutations();

  // Använd React Query när vi har teamId
  const { data: queryMembers, isLoading: queryLoading } = useQuery({
    queryKey: ['team-members', isQueryMode(props) ? props.teamId : null],
    queryFn: () => isQueryMode(props) ? teamService.getTeamMembers(props.teamId) : null,
    enabled: isQueryMode(props),
  });

  // Bestäm vilka medlemmar och laddningsstatus som ska användas baserat på prop-typ
  const members = isQueryMode(props) ? queryMembers : props.members;
  const isLoading = props.isLoading || (isQueryMode(props) && queryLoading);

  // Hanterare för händelser
  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    if (!isQueryMode(props) && props.onPromoteMember) {
      // Använd callback från props om den finns
      props.onPromoteMember(memberId, newRole);
    } else {
      // Annars använd hook
      await updateMemberRole.mutate({ memberId, newRole });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!isQueryMode(props) && props.onRemoveMember) {
      // Använd callback från props om den finns
      props.onRemoveMember(memberId);
    } else {
      // Annars använd hook
      await removeMember.mutate(memberId);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: TeamMember['status']) => {
    await updateMemberStatus.mutate({ memberId, newStatus });
  };

  // Memoizera renderItem för att undvika onödiga renders
  const renderItem = useMemo(() => ({ item }: { item: TeamMember }) => (
    <MemberItem
      member={item}
      currentUserRole={currentUserRole}
      onChangeRole={handleRoleChange}
      onRemove={handleRemove}
      onStatusChange={handleStatusChange}
      onSelect={onMemberSelect}
      variant={variant}
      showRoleBadge={showRoleBadges}
      showStatusBadge={showStatusBadges}
    />
  ), [currentUserRole, variant, showRoleBadges, showStatusBadges, onMemberSelect, handleRoleChange, handleRemove, handleStatusChange]);

  // Memoizera separator för att förhindra onödiga omrenderingar
  const ItemSeparator = useMemo(() => () => (
    <View style={[styles.separator, { backgroundColor: colors.border.light }]} />
  ), [colors.border.light]);

  // Beräkna estimerad item höjd baserat på variant
  const getItemHeight = () => {
    switch (variant) {
      case 'compact':
        return 64; // Kompakt layouthöjd
      case 'detailed':
        return 100; // Detaljerad layouthöjd
      default:
        return 76; // Standardhöjd
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!members || !members.length) {
    return (
      <EmptyState
        icon="users"
        title="Inga medlemmar"
        description="Det finns inga medlemmar i teamet än."
      />
    );
  }

  return (
    <FlatList
      data={members}
      renderItem={renderItem}
      keyExtractor={(item) => item.id || item.user_id}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={styles.list}
      extraData={[currentUserRole, variant, showRoleBadges, showStatusBadges]}
      // Optimeringar för prestanda
      removeClippedSubviews={true} // Ta bort element utanför viewport
      windowSize={5} // Antal skärmar att behålla renderade
      initialNumToRender={10} // Antal objekt att rendera initialt
      maxToRenderPerBatch={10} // Max antal att rendera per batch
      updateCellsBatchingPeriod={50} // Tid i ms mellan ui-uppdateringar
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    marginVertical: 2,
  },
}); 