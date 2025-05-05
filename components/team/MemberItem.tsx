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
}) => {
  const { colors, shadows } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [pressAnim] = useState(new Animated.Value(1));
  const [actionInProgress, setActionInProgress] = useState(false);
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (menuVisible && menuButtonRef.current && Platform.OS === 'web') {
      const rect = menuButtonRef.current.getBoundingClientRect();
      
      // Beräkna position
      let top = rect.bottom + window.scrollY;
      let left = rect.right - 180 + window.scrollX;
      
      // Kontrollera om menyn kommer att hamna utanför skärmen
      const menuHeight = 200; // Uppskattad höjd
      if (top + menuHeight > window.innerHeight + window.scrollY) {
        // Om det inte finns plats nedanför, placera den ovanför knappen istället
        top = rect.top - menuHeight + window.scrollY;
      }
      
      // Se till att menyn inte hamnar för långt till höger
      if (left + 180 > window.innerWidth + window.scrollX) {
        left = window.innerWidth - 190 + window.scrollX;
      }
      
      setMenuPosition({ x: left, y: top });
      
      // Funktion för att hantera klick utanför menyn
      const handleOutsideClick = (event: MouseEvent) => {
        if (
          menuButtonRef.current && 
          !menuButtonRef.current.contains(event.target as Node) &&
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setMenuVisible(false);
        }
      };
      
      // Lägg till lyssnare
      document.addEventListener('mousedown', handleOutsideClick);
      
      // Ta bort lyssnare vid cleanup
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [menuVisible]);

  useEffect(() => {
    if (!menuVisible) {
      setActiveSubmenu(null);
    }
  }, [menuVisible]);

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

  // Animera tryck på item
  const handlePressIn = () => {
    console.log('handlePressIn anropades');
    if (Platform.OS === 'web') {
      console.log('Kör web-specifik pressIn animation');
      pressAnim.setValue(0.98);
    } else {
      console.log('Kör native pressIn animation');
      Animated.spring(pressAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    console.log('handlePressOut anropades');
    if (Platform.OS === 'web') {
      console.log('Kör web-specifik pressOut animation');
      pressAnim.setValue(1);
    } else {
      console.log('Kör native pressOut animation');
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

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

  const menuItems = useMemo(() => {
    if (!showActions) return [];

    const items: MenuItem[] = [];
    const availableRoles = getAvailableRoles();

    // Lägg till rolländringsalternativ om det finns tillgängliga roller
    if (availableRoles.length > 0 && onChangeRole && member.role !== 'owner') {
      items.push({
        label: 'Ändra roll till',
        submenu: availableRoles.map(role => {
          // Skapa en bindning som fungerar oavsett hur klickhändelsen anropas
          const roleLabel = getRoleLabel(role);
          const handleClick = () => {
            console.log('Anropar handleRoleChange med explicit roll:', role);
            handleRoleChange(role);
          };
          
          return {
            label: roleLabel,
            onPress: handleClick,
            icon: getRoleIcon(role),
            // Spara rollen som attribut för att möjliggöra extrahering i onClick-hanteraren
            roleValue: role
          } as SubmenuItem;
        }),
      });
    }

    // Lägg till borttagningsalternativ om användaren har behörighet
    if (onRemove && (
      (currentUserRole === 'owner' && member.role !== 'owner') || 
      (currentUserRole === 'admin' && member.role === 'member')
    )) {
      items.push({
        label: 'Ta bort från team',
        onPress: handleRemoveMember,
        destructive: true,
      } as MenuItem);
    }

    return items;
  }, [currentUserRole, member.role, member.id, showActions, onChangeRole, onRemove]);

  const memberName = member.profile?.name || member.user?.email || 'Okänd användare';
  
  // Debug-info för profildata
  React.useEffect(() => {
    if (!member.profile?.name && process.env.NODE_ENV !== 'production') {
      console.debug(
        'Medlem saknar profilnamn:',
        {
          id: member.id,
          user_id: member.user_id,
          profile: member.profile,
          user: member.user
        }
      );
    }
  }, [member]);
  
  const toggleMenu = () => {
    if (!menuVisible && menuButtonRef.current) {
      console.log('Menu button clicked, opening menu');
      try {
        // Beräkna menyposition baserat på knappens position
        const rect = menuButtonRef.current.getBoundingClientRect();
        
        // Säkerställ att menyn visas inom fönstrets gränser
        const windowWidth = window.innerWidth;
        const menuWidth = 200; // Uppskattad menybredd
        
        // Beräkna x-position så att menyn inte hamnar utanför skärmen
        let xPos = rect.right;
        if (xPos + menuWidth > windowWidth) {
          xPos = rect.left - menuWidth;
        }
        if (xPos < 0) {
          xPos = 10; // Sätt minimum x-position
        }
        
        const yPos = Math.max(rect.bottom || 0, 0) + (window.scrollY || 0) + 5;
        
        setMenuPosition({
          x: xPos,
          y: yPos
        });
        console.log('Setting menu position to:', { x: xPos, y: yPos });
      } catch (error) {
        console.error('Fel vid beräkning av menyposition:', error);
        // Använd standardposition vid fel
        setMenuPosition({ x: 10, y: 100 });
      }
      // Öppna menyn efter att ha satt position
      setMenuVisible(true);
    } else {
      // Stäng menyn
      console.log('Menu button clicked, closing menu');
      setMenuVisible(false);
    }
  };

  // Om allt ser bra ut, rendera komponenten
  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      {isWeb ? (
        <div
          onClick={() => onSelect?.(member)}
          onMouseDown={handlePressIn}
          onMouseUp={handlePressOut}
          style={{
            ...containerStyle,
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center',
            cursor: !onSelect || actionInProgress ? 'default' : 'pointer',
            opacity: actionInProgress ? 0.7 : 1,
            position: 'relative',
            overflow: 'hidden'
          }}
          role="button"
          aria-disabled={!onSelect || actionInProgress}
          aria-label={`Teammedlem ${memberName}`}
          aria-busy={actionInProgress}
        >
          {actionInProgress && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.05)',
                zIndex: 5,
                pointerEvents: 'none'
              }}
            >
              <ActivityIndicator size="small" color={colors.text.light} />
            </div>
          )}
          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <Avatar
                size={variant === 'compact' ? 36 : variant === 'detailed' ? 48 : 40}
                source={member.profile?.avatar_url}
                fallback={member.profile?.name?.[0] || '?'}
              />
              {member.status === 'active' && (
                <View style={[styles.statusDot, { 
                  backgroundColor: colors.success,
                  borderColor: colors.background.card 
                }]} />
              )}
            </View>

            <View style={styles.info}>
              <Text 
                style={[styles.name, { 
                  color: colors.text.main,
                  fontSize: variant === 'compact' ? 14 : 16,
                }]}
                numberOfLines={1}
              >
                {memberName}
              </Text>
              
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
              <div
                ref={menuButtonRef}
                style={{
                  position: 'relative'
                }}
              >
                <div
                  onClick={toggleMenu}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: `1px solid ${colors.border.subtle}`,
                    backgroundColor: menuVisible 
                      ? colors.primary.main 
                      : colors.background.subtle,
                    cursor: actionInProgress ? 'not-allowed' : 'pointer',
                  }}
                  role="button"
                  aria-label="Öppna åtgärdsmeny"
                  aria-disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <ActivityIndicator size="small" color={colors.text.light} />
                  ) : (
                    <MoreVertical 
                      size={20} 
                      color={menuVisible ? colors.text.main : colors.text.light} 
                    />
                  )}
                </div>
                {menuVisible && menuPosition && (
                  <div
                    ref={menuRef}
                    style={{
                      position: 'fixed',
                      top: menuPosition.y,
                      left: menuPosition.x,
                      backgroundColor: colors.background.paper,
                      borderRadius: 8,
                      overflow: 'visible',
                      zIndex: 99999,
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                      minWidth: 180,
                      maxWidth: 250,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {menuItems.map((item, index) => (
                      <div
                        key={`menu-item-${index}`}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: index < menuItems.length - 1 ? `1px solid ${colors.border.subtle}` : 'none',
                          color: colors.text.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontSize: '14px',
                          position: 'relative',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Menyalternativ klickat:', item.label);
                          
                          if (item.submenu) {
                            console.log('Öppnar undermeny med alternativ:', item.submenu.map(sm => sm.label).join(', '));
                            setActiveSubmenu(activeSubmenu === index ? null : index);
                          } else if (item.onPress) {
                            console.log('Kör onPress för menyalternativ');
                            item.onPress();
                            setMenuVisible(false);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {item.icon && (
                              <div style={{ marginRight: 8 }}>
                                {React.createElement(item.icon, { 
                                  size: 18, 
                                  color: item.destructive ? colors.error : colors.text.main
                                })}
                              </div>
                            )}
                            <span style={{
                              fontWeight: 500,
                              color: item.destructive ? colors.error : colors.text.main,
                            }}>
                              {item.label}
                            </span>
                          </div>
                          {item.submenu && (
                            <div style={{ marginLeft: 8 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {item.submenu && activeSubmenu === index && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: '100%',
                            backgroundColor: colors.background.card,
                            border: `1px solid ${colors.border.subtle}`,
                            borderRadius: 12,
                            minWidth: 180,
                            zIndex: 10000,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}>
                            {item.submenu.map((subItem, subIndex) => (
                              <div
                                key={`submenu-item-${subIndex}`}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  borderBottom: subIndex < item.submenu!.length - 1 ? `1px solid ${colors.border.subtle}` : 'none',
                                  color: colors.text.main,
                                  display: 'flex',
                                  alignItems: 'center',
                                  fontFamily: 'system-ui, -apple-system, sans-serif',
                                  fontSize: '14px',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Klickade på undermenyalternativ:', subItem.label);
                                  
                                  // Kontrollera om alternativet har ett roleValue-attribut
                                  if (subItem.roleValue) {
                                    console.log('Använder explicit roleValue:', subItem.roleValue);
                                    handleRoleChange(subItem.roleValue);
                                  } 
                                  // Som en fallback, försök extrahera rollen från etiketten
                                  else if (subItem.label.includes('Admin') || subItem.label.includes('Medlem')) {
                                    const role = getRoleFromLabel(subItem.label);
                                    console.log('Extraherarad roll från etikett:', role);
                                    handleRoleChange(role);
                                  } 
                                  // För andra alternativ, använd den ursprungliga onPress-funktionen
                                  else if (subItem.onPress) {
                                    subItem.onPress();
                                  }
                                  
                                  setMenuVisible(false);
                                  setActiveSubmenu(null);
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {subItem.icon && (
                                      <div style={{ marginRight: 8 }}>
                                        {React.createElement(subItem.icon, { 
                                          size: 18, 
                                          color: subItem.destructive ? colors.error : colors.text.main 
                                        })}
                                      </div>
                                    )}
                                    <span style={{
                                      fontWeight: 500,
                                      color: subItem.destructive ? colors.error : colors.text.main,
                                    }}>
                                      {subItem.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </View>
        </div>
      ) : (
        <TouchableOpacity
          style={[containerStyle, styles.cardShadow]}
          onPress={() => onSelect?.(member)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!onSelect || actionInProgress}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Teammedlem ${memberName}`}
          accessibilityHint={actionInProgress ? 'Åtgärd pågår' : 'Tryck för att visa mer information'}
          accessibilityState={{ 
            disabled: actionInProgress,
            busy: actionInProgress
          }}
        >
          {actionInProgress && (
            <div 
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}
          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <Avatar
                size={variant === 'compact' ? 36 : variant === 'detailed' ? 48 : 40}
                source={member.profile?.avatar_url}
                fallback={member.profile?.name?.[0] || '?'}
              />
              {member.status === 'active' && (
                <View style={[styles.statusDot, { 
                  backgroundColor: colors.success,
                  borderColor: colors.background.card 
                }]} />
              )}
            </View>

            <View style={styles.info}>
              <Text 
                style={[styles.name, { 
                  color: colors.text.main,
                  fontSize: variant === 'compact' ? 14 : 16,
                }]}
                numberOfLines={1}
              >
                {memberName}
              </Text>
              
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
              <View>
                {!isWeb && (
                  <TouchableOpacity
                    onPress={toggleMenu}
                    style={[
                      styles.menuButton,
                      {
                        backgroundColor: menuVisible 
                          ? colors.primary.main 
                          : colors.background.subtle,
                        borderColor: colors.border.subtle,
                        opacity: actionInProgress ? 0.5 : 1
                      }
                    ]}
                    disabled={actionInProgress}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Öppna åtgärdsmeny"
                    accessibilityHint="Tryck för att visa tillgängliga åtgärder för medlemmen"
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
                {menuVisible && menuPosition && (
                  <View style={[
                    styles.menuDropdown,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.subtle,
                      ...Platform.select({
                        ios: shadows.medium,
                        android: {
                          elevation: 4,
                        },
                      }),
                    }
                  ]}>
                    {menuItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.menuItem,
                          {
                            borderBottomColor: colors.border.subtle,
                            borderBottomWidth: index < menuItems.length - 1 ? StyleSheet.hairlineWidth : 0,
                          }
                        ]}
                        onPress={() => {
                          item.onPress?.();
                          setMenuVisible(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {item.icon && (
                              <div style={{ marginRight: 8 }}>
                                {React.createElement(item.icon, { 
                                  size: 18, 
                                  color: item.destructive ? colors.error : colors.text.main
                                })}
                              </div>
                            )}
                            <span style={{
                              fontWeight: 500,
                              color: item.destructive ? colors.error : colors.text.main,
                            }}>
                              {item.label}
                            </span>
                          </div>
                          {item.submenu && (
                            <div style={{ marginLeft: 8 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}
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
});