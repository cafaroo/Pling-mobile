import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Animated, Platform, Text, TouchableOpacity, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TeamMember, TeamRole } from '@/types/team';
import * as teamService from '@/services/teamService';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { MemberItem, getRoleLabel, getRoleIcon } from './MemberItem';
import { useTeamMutations } from '@/hooks/useTeamMutations';
import { LinearGradient } from 'expo-linear-gradient';
import { MoreVertical, UserCog } from 'lucide-react-native';

// Hjälpfunktion för att extrahera medlemsnamn på ett konsekvent sätt på alla plattformar
const getMemberDisplayName = (member: TeamMember, index: number): string => {
  // Logga för att underlätta felsökning
  console.log('getMemberDisplayName för medlem:', {
    id: member.id,
    profileExists: !!member.profile,
    name: member.profile?.name,
    userId: member.user_id,
  });
  
  // Prioritetsordning för namn:
  // 1. member.profile.name om det finns och inte är tomt
  // 2. Fallback baserat på user_id
  // 3. Numrerad medlem om ingenting annat finns
  
  if (member.profile && typeof member.profile.name === 'string' && member.profile.name.trim() !== '') {
    return member.profile.name;
  } else if (member.user_id) {
    return `Användare-${member.user_id.substring(0, 4)}`;
  } else {
    return `Medlem ${index + 1}`;
  }
};

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
  
  // Använd object med medlems-ID som nycklar för att spåra knapptryckningar
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});

  // Toggle-funktion för en specifik knapp
  const toggleButtonPress = useCallback((memberId: string, isPressed: boolean) => {
    setPressedButtons(prev => ({
      ...prev,
      [memberId]: isPressed
    }));
  }, []);

  // Använd React Query när vi har teamId
  const { data: queryMembers, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['team-members', isQueryMode(props) ? props.teamId : null],
    queryFn: async () => {
      if (!isQueryMode(props)) return null;
      try {
        const members = await teamService.getTeamMembers(props.teamId);
        console.log('Hämtade medlemmar:', members);
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

  // Tillstånd för den anpassade menyn
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{
    memberId: string;
    memberName: string;
    type?: 'role' | 'remove';
    roles?: TeamRole[];
  } | null>(null);
  
  // Funktion för att visa anpassad meny istället för alert på alla plattformar
  const showCustomMenu = useCallback((memberId: string, memberName: string) => {
    setActiveMenu({ memberId, memberName });
    setMenuVisible(true);
  }, []);
  
  // Funktion för att visa rollvalsmenyn
  const showRoleSelectionMenu = useCallback((memberId: string, memberName: string) => {
    setMenuVisible(false);
    
    // Vänta lite så att animationen hinner stängas
    setTimeout(() => {
      const availableRoles = currentUserRole === 'owner' 
        ? ['admin', 'member'] as TeamRole[]
        : ['member'] as TeamRole[];
      
      setActiveMenu({ 
        memberId, 
        memberName,
        type: 'role',
        roles: availableRoles
      });
      setMenuVisible(true);
    }, 300);
  }, [currentUserRole]);
  
  // Funktion för att visa bekräftelsedialog för borttagning
  const showRemoveConfirmation = useCallback((memberId: string, memberName: string) => {
    setMenuVisible(false);
    
    // Vänta lite så att animationen hinner stängas
    setTimeout(() => {
      setActiveMenu({ 
        memberId, 
        memberName,
        type: 'remove'
      });
      setMenuVisible(true);
    }, 300);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: TeamMember; index: number }) => {
    // Enklare logik - logga bara data för debugging
    console.log(`Rendererar medlem ${index}:`, {
      id: item.id,
      name: item.profile?.name,
      userId: item.user_id,
      platform: Platform.OS,
      role: item.role,
      profilObjekt: item.profile ? JSON.stringify(item.profile) : 'saknas'
    });
    
    // Kontrollera om aktuell användare
    const isCurrentUser = false; // Detta bör bestämmas korrekt
    
    // Kontrollera om användaren kan modifiera denna medlem
    const canModify = currentUserRole === 'owner' || 
                     (currentUserRole === 'admin' && item.role !== 'owner' && item.role !== 'admin');
    
    // Få det aktuella tillståndet för denna medlems knapp
    const isButtonPressed = pressedButtons[item.id] || false;
    
    // Plattformsspecifik rendering för Android
    if (Platform.OS === 'android') {
      return (
        <View style={[
          styles.androidMemberItem,
          { 
            backgroundColor: colors.background.main,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border.subtle,
          }
        ]}>
          {/* Avatar-cirkel */}
          <View style={[
            styles.avatarCircle,
            { backgroundColor: colors.primary.light }
          ]}>
            <Text style={{
              color: colors.primary.main,
              fontSize: 18,
              fontWeight: 'bold',
            }}>
              {/* Använd första bokstaven från det konsekventa namnet */}
              {getMemberDisplayName(item, index).charAt(0).toUpperCase()}
            </Text>
          </View>
          
          {/* Namn och roll */}
          <View style={{ flex: 1 }}>
            <Text style={[
              styles.memberName,
              { color: colors.text.main }
            ]}>
              {/* Använd den nya hjälpfunktionen för konsekvent namnhantering */}
              {getMemberDisplayName(item, index)}
            </Text>
            <Text style={[
              styles.memberRole,
              { color: colors.text.light }
            ]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
          
          {/* Status-badge om aktiv */}
          {item.status === 'active' && (
            <View style={[
              styles.statusBadge, 
              { backgroundColor: 'rgba(34, 197, 94, 0.1)' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: colors.success }
              ]}>
                Aktiv
              </Text>
            </View>
          )}
          
          {/* Verktygsknapp - visas bara om användaren har rättigheter */}
          {canModify && (
            <TouchableOpacity
              onPress={() => {
                // Använd anpassad meny på alla plattformar
                showCustomMenu(item.id, getMemberDisplayName(item, index));
              }}
              onPressIn={() => toggleButtonPress(item.id, true)}
              onPressOut={() => toggleButtonPress(item.id, false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.background.light,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border.subtle,
              }}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color={colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // För Webb/iOS: använd fortfarande MemberItem men med anpassad meny
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
          isCurrentUser={isCurrentUser}
          // Lägg till props för att använda anpassad meny istället för standardmenyn
          useCustomMenu={true}
          onShowMenu={() => showCustomMenu(item.id, getMemberDisplayName(item, index))}
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
    handleStatusChange,
    colors,
    pressedButtons,
    toggleButtonPress,
    showCustomMenu
  ]);

  const keyExtractor = useCallback((item: TeamMember) => item.id || item.user_id, []);

  const ItemSeparator = useCallback(() => (
    <View style={[styles.separator, { backgroundColor: colors.border.subtle }]} />
  ), [colors.border.subtle]);

  const ListEmptyComponent = useCallback(() => (
    <EmptyState
      icon="users"
      title="Inga medlemmar"
      message="Det finns inga medlemmar i teamet än."
      iconColor={colors.primary.main}
    />
  ), [colors.primary.main]);

  const ListHeaderComponent = useCallback(() => (
    <View style={[styles.header, { borderBottomColor: colors.border.subtle }]} />
  ), [colors.border.subtle]);

  const ListFooterComponent = useCallback(() => (
    <View style={[styles.footer, { borderTopColor: colors.border.subtle }]} />
  ), [colors.border.subtle]);

  // Funktion för att uppdatera lista med medlemmar
  const refreshMemberList = useCallback(() => {
    if (isQueryMode(props)) {
      return queryClient.invalidateQueries({ queryKey: ['team-members', props.teamId] });
    }
    return Promise.resolve();
  }, [queryClient, props]);

  // Anpassad meny för Android
  const renderCustomMenu = () => {
    if (!activeMenu || !menuVisible) return null;
    
    // Om det är en rollvalsmeny
    if (activeMenu.type === 'role') {
      return (
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[
                  styles.menuContainer, 
                  { 
                    backgroundColor: colors.background.dark,
                    borderColor: colors.border.default,
                    borderWidth: 1,
                  }
                ]}>
                  <View style={styles.menuHeader}>
                    <Text style={[styles.menuTitle, { color: colors.text.main }]}>
                      Välj ny roll
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: colors.text.light }]}>
                      För {activeMenu.memberName}
                    </Text>
                  </View>
                  
                  <View style={styles.menuDivider} />
                  
                  {activeMenu.roles?.map((role, index) => (
                    <TouchableOpacity
                      key={role}
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        handleRoleChange(activeMenu.memberId, role as TeamRole);
                      }}
                    >
                      {React.createElement(getRoleIcon(role as TeamRole), { 
                        size: 20, 
                        color: colors.primary.light, 
                        style: { marginRight: 12 } 
                      })}
                      <Text style={[styles.menuItemText, { color: colors.text.main }]}>
                        {getRoleLabel(role as TeamRole)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    style={[styles.menuItem, styles.cancelItem]}
                    onPress={() => setMenuVisible(false)}
                  >
                    <Text style={[styles.menuItemText, { color: colors.text.light }]}>
                      Avbryt
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
    
    // Om det är en borttagningsbekräftelse
    if (activeMenu.type === 'remove') {
      return (
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[
                  styles.menuContainer, 
                  { 
                    backgroundColor: colors.background.dark,
                    borderColor: colors.border.default,
                    borderWidth: 1,
                  }
                ]}>
                  <View style={styles.menuHeader}>
                    <Text style={[styles.menuTitle, { color: colors.text.main }]}>
                      Bekräfta borttagning
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: colors.text.light }]}>
                      Är du säker på att du vill ta bort {activeMenu.memberName} från teamet?
                    </Text>
                  </View>
                  
                  <View style={styles.menuDivider} />
                  
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      handleRemove(activeMenu.memberId);
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: colors.error }]}>
                      Ta bort från team
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.menuItem, styles.cancelItem]}
                    onPress={() => setMenuVisible(false)}
                  >
                    <Text style={[styles.menuItemText, { color: colors.text.light }]}>
                      Avbryt
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
    
    // Standardmenyn med val
    return (
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.menuContainer, 
                { 
                  backgroundColor: colors.background.dark,
                  borderColor: colors.border.default,
                  borderWidth: 1,
                }
              ]}>
                <View style={styles.menuHeader}>
                  <Text style={[styles.menuTitle, { color: colors.text.main }]}>
                    {activeMenu.memberName}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: colors.text.light }]}>
                    Välj en åtgärd:
                  </Text>
                </View>
                
                <View style={styles.menuDivider} />
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => showRoleSelectionMenu(activeMenu.memberId, activeMenu.memberName)}
                >
                  <UserCog size={20} color={colors.primary.light} style={{ marginRight: 12 }} />
                  <Text style={[styles.menuItemText, { color: colors.text.main }]}>
                    Ändra roll
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => showRemoveConfirmation(activeMenu.memberId, activeMenu.memberName)}
                >
                  <MoreVertical size={20} color={colors.error} style={{ marginRight: 12 }} />
                  <Text style={[styles.menuItemText, { color: colors.error }]}>
                    Ta bort från team
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.menuItem, styles.cancelItem]}
                  onPress={() => setMenuVisible(false)}
                >
                  <Text style={[styles.menuItemText, { color: colors.text.light }]}>
                    Avbryt
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

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
          message="Kunde inte hämta teammedlemmar. Försök igen senare."
          iconColor={colors.error}
          action={{
            label: 'Försök igen',
            onPress: refreshMemberList,
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
        onRefresh={refreshMemberList}
        refreshing={isLoading}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
      
      {renderCustomMenu()}
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
  // Nya stilar för verktygsknappen
  androidMemberItem: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
  },
  // Stilar för anpassad meny
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  menuContainer: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuHeader: {
    padding: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
}); 