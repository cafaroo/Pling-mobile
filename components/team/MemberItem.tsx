import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { TeamMember, TeamRole, TeamMemberStatus } from '@/types/team';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Menu } from '@/components/ui/Menu';
import { MoreVertical, Shield, UserCog, MessageSquare, User, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

/**
 * Props för MemberItem-komponenten
 * 
 * @interface MemberItemProps
 * @property {TeamMember} member - Teammedlemmen som ska visas
 * @property {TeamRole} [currentUserRole] - Den aktuella användarens roll i teamet
 * @property {boolean} [showActions] - Om åtgärdsmeny ska visas
 * @property {boolean} [showRoleLabel] - Om rollbeteckning ska visas
 * @property {boolean} [showStatusBadge] - Om statusbadge ska visas
 * @property {boolean} [showRoleBadge] - Om rollbadge ska visas
 * @property {'default' | 'compact' | 'detailed'} [variant] - Visningsvariant av komponenten
 * @property {(memberId: string, newRole: TeamRole) => Promise<void> | void} [onChangeRole] - Callback vid rollförändring
 * @property {(memberId: string) => Promise<void> | void} [onRemove] - Callback vid borttagning av medlem
 * @property {(member: TeamMember) => void} [onSelect] - Callback vid val av medlem
 * @property {(memberId: string, status: TeamMember['status']) => Promise<void> | void} [onStatusChange] - Callback vid statusförändring
 * @property {boolean} [isCurrentUser] - Om denna medlem är den inloggade användaren
 * @property {boolean} [useCustomMenu] - Om den anpassade menyn ska användas istället för inbyggd meny
 * @property {() => void} [onShowMenu] - Callback vid begäran att visa menyn (används med useCustomMenu)
 */
export interface MemberItemProps {
  member: TeamMember;
  currentUserRole?: TeamRole;
  showActions?: boolean;
  showRoleLabel?: boolean;
  showStatusBadge?: boolean;
  showRoleBadge?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onChangeRole?: (memberId: string, newRole: TeamRole) => Promise<void> | void;
  onRemove?: (memberId: string) => Promise<void> | void;
  onSelect?: (member: TeamMember) => void;
  onStatusChange?: (memberId: string, status: TeamMember['status']) => Promise<void> | void;
  isCurrentUser?: boolean;
  useCustomMenu?: boolean;
  onShowMenu?: () => void;
}

interface SubmenuItem {
  label: string;
  onPress: () => void;
  icon?: any;
  destructive?: boolean;
  roleValue?: TeamRole;
}

interface MenuItem {
  label: string;
  onPress?: () => void;
  icon?: any;
  destructive?: boolean;
  submenu?: SubmenuItem[];
}

/**
 * Hämta ikonen för en specifik teamroll
 * 
 * @param {TeamRole} role - Teamrollen att hämta ikon för
 * @returns {React.ComponentType} - Ikonen för den angivna rollen
 */
export const getRoleIcon = (role: TeamRole) => {
  switch (role) {
    case 'owner':
      return Shield;
    case 'admin':
      return UserCog;
    case 'member':
    default:
      return User;
  }
};

/**
 * Hämta etikettext för en specifik teamroll
 * 
 * @param {TeamRole} role - Teamrollen att hämta etikett för
 * @returns {string} - Lokaliserad etikettext för den angivna rollen
 */
export const getRoleLabel = (role: TeamRole): string => {
  switch (role) {
    case 'owner':
      return 'Ägare';
    case 'admin':
      return 'Admin';
    case 'member':
    default:
      return 'Medlem';
  }
};

/**
 * Omvänd konvertering från etikett till roll
 * 
 * @param {string} label - Etiketten att konvertera
 * @returns {TeamRole} - Motsvarande roll
 */
export const getRoleFromLabel = (label: string): TeamRole => {
  switch (label) {
    case 'Ägare':
      return 'owner';
    case 'Admin':
      return 'admin';
    case 'Medlem':
    default:
      return 'member';
  }
};

/**
 * Hämta beskrivningstext för en specifik teamroll
 * 
 * @param {TeamRole} role - Teamrollen att hämta beskrivning för
 * @returns {string} - Lokaliserad beskrivningstext för den angivna rollen
 */
export const getRoleDescription = (role: TeamRole): string => {
  switch (role) {
    case 'owner':
      return 'Kan hantera alla aspekter av teamet';
    case 'admin':
      return 'Kan hantera teamet och dess medlemmar';
    case 'member':
    default:
      return 'Standardmedlem med grundläggande rättigheter';
  }
};

/**
 * Hämta etikettext för en specifik medlemsstatus
 * 
 * @param {TeamMemberStatus} status - Medlemsstatusen att hämta etikett för
 * @returns {string} - Lokaliserad etikettext för den angivna statusen
 */
export const getStatusLabel = (status: TeamMemberStatus): string => {
  switch (status) {
    case TeamMemberStatus.ACTIVE:
      return 'Aktiv';
    case TeamMemberStatus.PENDING:
      return 'Väntar';
    case TeamMemberStatus.INVITED:
      return 'Inbjuden';
    case TeamMemberStatus.INACTIVE:
      return 'Inaktiv';
    default:
      return 'Okänd';
  }
};

/**
 * Hämta färg för en specifik medlemsstatus
 * 
 * @param {TeamMemberStatus} status - Medlemsstatusen att hämta färg för
 * @param {Object} colors - Tema-färgobjekt från useTheme
 * @returns {string} - Färgkod för den angivna statusen
 */
export const getStatusColor = (status: TeamMemberStatus, colors: any) => {
  switch (status) {
    case TeamMemberStatus.ACTIVE:
      return colors.success;
    case TeamMemberStatus.INVITED:
    case TeamMemberStatus.PENDING:
      return colors.warning;
    case TeamMemberStatus.INACTIVE:
      return colors.error;
    default:
      return colors.neutral[500];
  }
};

/**
 * Kontrollerar om en användare med en viss roll kan modifiera en annan användare med en viss roll
 */
export const canModifyRole = (currentUserRole: TeamRole, targetUserRole: TeamRole): boolean => {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    moderator: 2,
    member: 1,
  };

  // Owner kan modifiera alla utom andra owners
  if (currentUserRole === 'owner') {
    return targetUserRole !== 'owner';
  }

  // Admin kan modifiera moderators och members
  if (currentUserRole === 'admin') {
    return targetUserRole !== 'owner' && targetUserRole !== 'admin';
  }

  // Andra roller kan inte modifiera
  return false;
};

/**
 * Jämför MemberItemProps för att avgöra om komponenten behöver omrenderas
 * Används med React.memo för prestandaoptimering
 * 
 * @param {MemberItemProps} prevProps - Föregående props
 * @param {MemberItemProps} nextProps - Nya props
 * @returns {boolean} - true om propsarna är likvärdiga (ingen omrendering behövs), annars false
 */
const areMemberPropsEqual = (prevProps: MemberItemProps, nextProps: MemberItemProps): boolean => {
  // Jämför de viktigaste egenskaperna först
  if (prevProps.member.id !== nextProps.member.id) return false;
  if (prevProps.member.role !== nextProps.member.role) return false;
  if (prevProps.member.status !== nextProps.member.status) return false;
  if (prevProps.currentUserRole !== nextProps.currentUserRole) return false;
  if (prevProps.isCurrentUser !== nextProps.isCurrentUser) return false;
  
  // Jämför visuella egenskaper
  if (prevProps.showActions !== nextProps.showActions) return false;
  if (prevProps.showRoleLabel !== nextProps.showRoleLabel) return false;
  if (prevProps.showStatusBadge !== nextProps.showStatusBadge) return false;
  if (prevProps.showRoleBadge !== nextProps.showRoleBadge) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  
  // Jämför referentiella egenskaper (callbacks)
  // Här antar vi att callbacks inte ändras ofta och ignorerar dem för bättre prestanda
  // Djupare jämförelse av objekt
  if (prevProps.member.profile?.name !== nextProps.member.profile?.name) return false;
  if (prevProps.member.profile?.avatar_url !== nextProps.member.profile?.avatar_url) return false;
  
  // Om allt ovanstående är samma, anta att props är lika
  return true;
};

/**
 * Lägg till följande hjälpfunktion någonstans före MemberItemBase
 * 
 * @param {string | undefined} name - Medlemsnamnet att rendera
 * @param {string} userId - Användarens ID
 * @param {any} colors - Tema-färgobjekt från useTheme
 * @returns {React.ReactElement} - Rendernat medlemsnamn
 */
const renderAndroidMemberName = (name: string | undefined, userId: string, colors: any) => {
  // Säkerställ att vi alltid har ett värde att visa
  const displayName = name || userId.substring(0, 8) || 'Medlem';
  
  return (
    <Text 
      style={{
        color: colors.text.main,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        paddingVertical: 4,
        paddingHorizontal: 2,
      }}
    >
      {displayName}
    </Text>
  );
};

/**
 * Bas-komponent för att visa en teammedlem
 * 
 * Denna komponent visar information om en teammedlem, inklusive namn, avatar, roll och status.
 * Den hanterar även användarinteraktioner som rollförändring och borttagning av medlemmar
 * beroende på användarens behörigheter.
 * 
 * @param {MemberItemProps} props - Komponentens props
 * @returns {React.ReactElement} Renderad medlem
 */
const MemberItemBase: React.FC<MemberItemProps> = ({
  member,
  currentUserRole = 'member',
  showActions = true,
  showRoleLabel = true,
  showStatusBadge = true,
  showRoleBadge = true,
  variant = 'default',
  onChangeRole,
  onRemove,
  onSelect,
  onStatusChange,
  isCurrentUser = false,
  useCustomMenu = false,
  onShowMenu,
}) => {
  const { colors, shadows } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [pressAnim] = useState(new Animated.Value(1));
  const [actionInProgress, setActionInProgress] = useState(false);
  const menuButtonRef = useRef<any>(null);
  const isWeb = Platform.OS === 'web';

  // Förbättrad extraktion av medlemsnamn för konsekvent användning över plattformar
  const memberName = useMemo(() => {
    if (!member) return 'Okänd medlem';
    
    // Loggning för debugging
    console.log('MemberItem profile:', {
      profile: member.profile,
      name: member.profile?.name,
      platform: Platform.OS,
      fallback: `Användare-${member.user_id.substring(0, 4)}`
    });
    
    // Mer robust logik för att hantera profilen
    if (member.profile && typeof member.profile.name === 'string' && member.profile.name.trim() !== '') {
      return member.profile.name;
    } else if (member.user_id) {
      return `Användare-${member.user_id.substring(0, 4)}`;
    } else {
      return 'Okänd medlem';
    }
  }, [member]);

  // Animera tryck på item
  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Kontrollera om den aktuella användaren kan modifiera denna medlem
  const canModify = useMemo(() => {
    if (isCurrentUser) return false;
    if (!showActions) return false;
    if (!onChangeRole && !onRemove) return false;
    
    // Owner kan modifiera alla utom andra owners
    if (currentUserRole === 'owner') {
      return member.role !== 'owner';
    }
    
    // Admin kan modifiera moderators och members
    if (currentUserRole === 'admin') {
      return member.role !== 'owner' && member.role !== 'admin';
    }
    
    return false;
  }, [currentUserRole, member.role, isCurrentUser, showActions, onChangeRole, onRemove]);
  
  const handleRoleChange = async (newRole: TeamRole) => {
    console.log('handleRoleChange anropades', { newRole, memberId: member.id, canModify, actionInProgress });
    
    if (!onChangeRole || actionInProgress || !canModify) {
      console.log('Kunde inte ändra roll:', { 
        hasOnChangeRole: !!onChangeRole, 
        actionInProgress, 
        canModify 
      });
      return;
    }

    const roleLabel = getRoleLabel(newRole);
    const memberName = member.profile?.name || 'medlemmen';
    
    setActionInProgress(true);
    setMenuVisible(false); // Stäng menyn direkt
    
    try {
      console.log('Förbereder anrop till onChangeRole med:', { memberId: member.id, role: newRole, roleType: typeof newRole });
      await onChangeRole(member.id, newRole);
      console.log(`Uppdaterade rollen för ${memberName} till ${roleLabel}`);
    } catch (error) {
      console.error('Fel vid ändring av roll:', error);
      Alert.alert('Fel', `Kunde inte ändra roll för ${memberName}. Försök igen senare.`);
    } finally {
      setActionInProgress(false);
    }
  };
  
  const handleRemoveMember = () => {
    console.log('handleRemoveMember anropades', { memberId: member.id, canModify, actionInProgress });
    
    if (!onRemove || actionInProgress || !canModify) {
      console.log('Kunde inte ta bort medlem:', { 
        hasOnRemove: !!onRemove, 
        actionInProgress, 
        canModify 
      });
      return;
    }

    const memberName = member.profile?.name || 'medlemmen';
    
    setMenuVisible(false); // Stäng menyn direkt
    
    Alert.alert(
      'Bekräfta borttagning',
      `Är du säker på att du vill ta bort ${memberName} från teamet?`,
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(true);
            try {
              await onRemove(member.id);
              console.log(`Tog bort ${memberName} från teamet`);
            } catch (error) {
              console.error('Fel vid borttagning av medlem:', error);
              Alert.alert('Fel', `Kunde inte ta bort ${memberName}. Försök igen senare.`);
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ],
    );
  };
  
  /**
   * Hantera statusförändring med bekräftelsedialog
   * 
   * @param {TeamMember['status']} newStatus - Den nya statusen att tilldela medlemmen
   */
  const handleStatusChange = async (newStatus: TeamMember['status']) => {
    if (!onStatusChange || actionInProgress) return;

    const memberName = member.profile?.name || 'användaren';
    const statusLabel = getStatusLabel(newStatus);
    const isActivating = newStatus === 'active';

    Alert.alert(
      `${isActivating ? 'Aktivera' : 'Inaktivera'} medlem`,
      `Är du säker på att du vill ${isActivating ? 'aktivera' : 'inaktivera'} ${memberName}?\n\n${
        isActivating
          ? 'Medlemmen kommer att få tillgång till teamet igen.'
          : 'Medlemmen kommer att förlora tillgång till teamet tillfälligt.'
      }`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Bekräfta',
          style: isActivating ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setActionInProgress(true);
              await onStatusChange(member.id, newStatus);
              setMenuVisible(false);
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte ändra medlemmens status. Försök igen senare.');
            } finally {
              setActionInProgress(false);
            }
          },
        },
      ]
    );
  };
  
  const getAvailableRoles = (): TeamRole[] => {
    switch (currentUserRole) {
      case 'owner':
        return ['admin', 'member'];
      case 'admin':
        return ['member'];
      default:
        return [];
    }
  };

  // Skapa menyalternativ baserat på tillgängliga åtgärder
  const menuItems = useMemo(() => {
    if (!canModify) return [];

    const items: MenuItem[] = [];
    
    // Lägg till rollalternativ om vi kan ändra roller
    if (onChangeRole) {
    const availableRoles = getAvailableRoles();
      if (availableRoles.length > 0) {
        const roleSubmenu: SubmenuItem[] = availableRoles.map(role => ({
          label: getRoleLabel(role),
          roleValue: role,
          onPress: () => handleRoleChange(role),
          icon: getRoleIcon(role),
        }));
        
      items.push({
          label: 'Ändra roll',
          icon: UserCog,
          submenu: roleSubmenu,
        });
      }
    }
    
    // Lägg till ta bort medlem
    if (onRemove) {
      items.push({
        label: 'Ta bort från team',
        onPress: handleRemoveMember,
        destructive: true,
        icon: member.status === 'inactive' ? Shield : UserCog,
      });
    }
    
    // Lägg till statushantering om den finns tillgänglig
    if (onStatusChange && member.status !== 'pending') {
      if (member.status === 'active') {
        items.push({
          label: 'Inaktivera konto',
          onPress: () => handleStatusChange('inactive'),
          icon: User,
        });
      } else if (member.status === 'inactive') {
        items.push({
          label: 'Aktivera konto',
          onPress: () => handleStatusChange('active'),
          icon: User,
        });
      }
    }
    
    return items;
  }, [canModify, onChangeRole, onRemove, onStatusChange, member.status]);

  // Toggle för native-menyn
  const toggleMenu = () => {
    if (useCustomMenu && onShowMenu) {
      // Använd den anpassade menyn om den är aktiverad
      onShowMenu();
    } else {
      // Annars använd standardmenyn
      setMenuVisible(!menuVisible);
    }
  };

  // Beräkna behållarstil baserat på variant
  const containerStyle = useMemo(() => {
    const baseStyle = {
      ...styles.container,
      backgroundColor: colors.background.card,
      borderColor: colors.border.subtle,
      ...Platform.select({
        ios: {
          ...shadows.small,
          overflow: 'hidden',
        },
        android: {
          elevation: 2,
          overflow: 'hidden',
        },
        web: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        },
      }),
    };

    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          paddingVertical: 10,
          minHeight: 56,
        };
      case 'detailed':
        return {
          ...baseStyle,
          paddingVertical: 14,
          minHeight: 88,
        };
      default:
        return {
          ...baseStyle,
          paddingVertical: 12,
          minHeight: 72,
        };
    }
  }, [colors, shadows, variant]);

  const RoleIcon = getRoleIcon(member.role);

  // Rendera cross-platform menyn baserat på platformstyp
  const renderMenu = () => {
    // Om anpassad meny används, visa ingen inbyggd meny
    if (useCustomMenu) return null;
    
    // Om det inte finns några menyalternativ eller inte är synlig, visa inget
    if (!menuVisible || menuItems.length === 0) return null;
    
    return (
      <Menu
        items={menuItems}
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={menuButtonRef}
        mode="action"
      />
    );
  };

  return (
    <Animated.View style={[{ transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        onPress={() => onSelect?.(member)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={!onSelect || actionInProgress}
        style={[containerStyle, { opacity: actionInProgress ? 0.7 : 1 }]}
        >
          {actionInProgress && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.05)',
                zIndex: 5,
          }}>
              <ActivityIndicator size="small" color={colors.text.light} />
          </View>
          )}

          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <Avatar
                size={variant === 'compact' ? 36 : variant === 'detailed' ? 48 : 40}
                source={member.profile?.avatar_url}
              fallback={Platform.OS === 'android' ? 
                // På Android, använd första bokstaven i namnet eller användar-ID
                (member.profile?.name?.[0]?.toUpperCase() || member.user_id?.[0] || '?') : 
                // På andra plattformar, använd normal fallback
                (memberName[0] || '?')}
              />
              {member.status === 'active' && (
                <View style={[styles.statusDot, { 
                  backgroundColor: colors.success,
                  borderColor: colors.background.card 
                }]} />
              )}
            </View>

            <View style={styles.info}>
            {/* Specialhantering för Android */}
            {Platform.OS === 'android' ? (
              // Direktare renderingsmetod för Android
              renderAndroidMemberName(member.profile?.name, member.user_id, colors)
            ) : (
              // För webb och iOS
              <Text 
                style={[styles.name, { 
                  color: colors.text.main,
                  fontSize: variant === 'compact' ? 14 : 16,
                }]}
                numberOfLines={1}
                testID="member-name-text-web"
              >
                {memberName}
              </Text>
            )}
              
              {showRoleLabel && (
                <View style={styles.roleContainer}>
                  <RoleIcon 
                    size={variant === 'compact' ? 12 : 14} 
                    color={colors.text.light} 
                    style={styles.roleIcon} 
                  />
                  <Text style={[styles.role, { 
                    color: colors.text.light,
                    fontSize: variant === 'compact' ? 12 : 14,
                  }]}>
                    {getRoleLabel(member.role)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.badgeContainer}>
              {showStatusBadge && (
                <Badge
                  label={getStatusLabel(member.status)}
                  color={getStatusColor(member.status, colors)}
                  style={styles.statusBadge}
                  size={variant === 'compact' ? 'small' : 'medium'}
                />
              )}
              
              {showRoleBadge && (
                <Badge
                  icon={getRoleIcon(member.role)}
                  label={getRoleLabel(member.role)}
                  color={colors.primary.main}
                  style={styles.roleBadge}
                  size={variant === 'compact' ? 'small' : 'medium'}
                />
              )}
            </View>

            {canModify && menuItems.length > 0 && (
            <TouchableOpacity
                ref={menuButtonRef}
              onPress={toggleMenu}
              disabled={actionInProgress}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border.subtle,
                    backgroundColor: menuVisible 
                      ? colors.primary.main 
                      : colors.background.subtle,
                  }}
                >
                  {actionInProgress ? (
                    <ActivityIndicator size="small" color={colors.text.light} />
                  ) : (
                    <MoreVertical 
                      size={20} 
                      color={menuVisible ? colors.text.main : colors.text.light} 
                    />
                  )}
            </TouchableOpacity>
              )}
            </View>

        {renderMenu()}
                  </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Memoized MemberItem-komponent för förbättrad prestanda
 * 
 * Denna komponent renderar information om en teammedlem och hanterar
 * olika användarinteraktioner baserat på behörigheter. Komponenten
 * använder React.memo för att förhindra onödiga omrenderingar.
 * 
 * @type {React.NamedExoticComponent<MemberItemProps>}
 */
export const MemberItem = React.memo(MemberItemBase, areMemberPropsEqual);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  cardShadow: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleIcon: {
    opacity: 0.8,
  },
  role: {
    letterSpacing: 0.2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    marginLeft: 4,
  },
  roleBadge: {
    marginLeft: 2,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  menuDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemIcon: {
    marginRight: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  androidNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});