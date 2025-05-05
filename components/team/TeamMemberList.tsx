import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, Animated } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TeamMember, TeamRole } from '@/types/team';
import * as teamService from '@/services/teamService';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MemberItem } from './MemberItem';
import { useTeamMutations } from '@/hooks/useTeamMutations';
import { LinearGradient } from 'expo-linear-gradient';

// Basinterface för gemensamma props
interface TeamMemberListBaseProps {
  currentUserRole: TeamRole;
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showRoleBadges?: boolean;
  showStatusBadges?: boolean;
  onMemberSelect?: (member: TeamMember) => void;
}

// Interface för direkt medlemslista
interface DirectMemberListProps extends TeamMemberListBaseProps {
  members: TeamMember[];
}

// Interface för query-baserad medlemslista
interface QueryMemberListProps extends TeamMemberListBaseProps {
  teamId: string;
}

// Union type för alla möjliga props
type TeamMemberListProps = DirectMemberListProps | QueryMemberListProps;

// Type guard för att skilja mellan prop-typer
const isQueryMode = (props: TeamMemberListProps): props is QueryMemberListProps => {
  return 'teamId' in props;
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
  const queryClient = useQueryClient();
  const { updateMemberRole, removeMember, updateMemberStatus } = useTeamMutations();

  // Använd React Query när vi har teamId
  const { data: queryMembers, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['team-members', isQueryMode(props) ? props.teamId : null],
    queryFn: async () => {
      if (!isQueryMode(props)) return null;
      try {
        const members = await teamService.getTeamMembers(props.teamId);
        return members;
      } catch (error) {
        console.error('Fel vid hämtning av medlemmar:', error);
        throw error;
      }
    },
    enabled: isQueryMode(props),
  });

  // Bestäm vilka medlemmar och laddningsstatus som ska användas baserat på prop-typ
  const members = isQueryMode(props) ? queryMembers : props.members;
  const isLoading = props.isLoading || (isQueryMode(props) && queryLoading);

  // Optimistisk uppdatering för rollförändring
  const handleRoleChange = useCallback(async (memberId: string, newRole: TeamRole) => {
    if (isQueryMode(props)) {
      const previousMembers = queryClient.getQueryData(['team-members', props.teamId]);
      
      // Optimistiskt uppdatera UI
      queryClient.setQueryData(['team-members', props.teamId], (old: any) => {
        if (!old) return old;
        return old.map((member: TeamMember) =>
          member.id === memberId ? { ...member, role: newRole } : member
        );
      });

      try {
        await updateMemberRole.mutateAsync({ memberId, newRole });
      } catch (error) {
        // Vid fel, återställ till tidigare data
        queryClient.setQueryData(['team-members', props.teamId], previousMembers);
        throw error;
      }
    }
  }, [props, queryClient, updateMemberRole]);

  // Optimistisk uppdatering för borttagning
  const handleRemove = useCallback(async (memberId: string) => {
    if (isQueryMode(props)) {
      const previousMembers = queryClient.getQueryData(['team-members', props.teamId]);
      
      // Optimistiskt uppdatera UI
      queryClient.setQueryData(['team-members', props.teamId], (old: any) => {
        if (!old) return old;
        return old.filter((member: TeamMember) => member.id !== memberId);
      });

      try {
        await removeMember.mutateAsync({ memberId });
      } catch (error) {
        // Vid fel, återställ till tidigare data
        queryClient.setQueryData(['team-members', props.teamId], previousMembers);
        throw error;
      }
    }
  }, [props, queryClient, removeMember]);

  // Optimistisk uppdatering för statusförändring
  const handleStatusChange = useCallback(async (memberId: string, newStatus: TeamMember['status']) => {
    if (isQueryMode(props)) {
      const previousMembers = queryClient.getQueryData(['team-members', props.teamId]);
      
      // Optimistiskt uppdatera UI
      queryClient.setQueryData(['team-members', props.teamId], (old: any) => {
        if (!old) return old;
        return old.map((member: TeamMember) =>
          member.id === memberId ? { ...member, status: newStatus } : member
        );
      });

      try {
        await updateMemberStatus.mutateAsync({ memberId, newStatus });
      } catch (error) {
        // Vid fel, återställ till tidigare data
        queryClient.setQueryData(['team-members', props.teamId], previousMembers);
        throw error;
      }
    }
  }, [props, queryClient, updateMemberStatus]);

  const renderItem = useCallback(({ item, index }: { item: TeamMember; index: number }) => {
    const animationDelay = index * 50; // Snabbare staggered animation

    return (
      <Animated.View
        style={{
          opacity: 1,
          transform: [{
            translateY: 0
          }],
        }}
      >
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
          showActions={true}
          isCurrentUser={false}
        />
      </Animated.View>
    );
  }, [
    currentUserRole,
    variant,
    showRoleBadges,
    showStatusBadges,
    onMemberSelect,
    handleRoleChange,
    handleRemove,
    handleStatusChange
  ]);

  const keyExtractor = useCallback((item: TeamMember) => item.id || item.user_id, []);

  const ItemSeparator = useCallback(() => (
    <View style={[styles.separator, { backgroundColor: colors.border.subtle }]} />
  ), [colors.border.subtle]);

  const ListEmptyComponent = useCallback(() => (
    <EmptyState
      icon="users"
      title="Inga medlemmar"
      description="Det finns inga medlemmar i teamet än."
      iconColor={colors.primary.main}
    />
  ), [colors.primary.main]);

  const ListHeaderComponent = useCallback(() => (
    <View style={[styles.header, { borderBottomColor: colors.border.subtle }]} />
  ), [colors.border.subtle]);

  const ListFooterComponent = useCallback(() => (
    <View style={[styles.footer, { borderTopColor: colors.border.subtle }]} />
  ), [colors.border.subtle]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background.dark, colors.background.main]}
          style={StyleSheet.absoluteFill}
        />
        <LoadingState message="Hämtar teammedlemmar..." />
      </View>
    );
  }

  if (queryError) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background.dark, colors.background.main]}
          style={StyleSheet.absoluteFill}
        />
        <EmptyState
          icon="alert-circle"
          title="Något gick fel"
          description="Kunde inte hämta teammedlemmar. Försök igen senare."
          iconColor={colors.error}
          action={{
            label: 'Försök igen',
            onPress: () => queryClient.invalidateQueries(['team-members', isQueryMode(props) ? props.teamId : null]),
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark, colors.background.main]}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={members}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        windowSize={5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        decelerationRate="normal"
        scrollEventThrottle={16}
        onRefresh={() => queryClient.invalidateQueries(['team-members', isQueryMode(props) ? props.teamId : null])}
        refreshing={isLoading}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
    opacity: 0.1,
  },
  header: {
    height: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    height: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
}); 