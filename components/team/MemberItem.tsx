import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { TeamMember, TeamRole, TeamMemberStatus } from '@/types/team';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Menu } from '@/components/ui/Menu';
import { MoreVertical, Shield, UserCog, MessageSquare, User } from 'lucide-react-native';

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
    case 'moderator':
      return MessageSquare;
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
    case 'moderator':
      return 'Moderator';
    case 'member':
    default:
      return 'Medlem';
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
    case 'moderator':
      return 'Kan moderera innehåll och hantera meddelanden';
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
 * 
 * @param {TeamRole} currentUserRole - Den aktuella användarens roll
 * @param {TeamRole} targetUserRole - Målanvändarens roll
 * @returns {boolean} - true om användaren kan modifiera målanvändaren, annars false
 */
export const canModifyRole = (currentUserRole: TeamRole, targetUserRole: TeamRole): boolean => {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    moderator: 2,
    member: 1,
    guest: 0,
  };
  
  return (
    roleHierarchy[currentUserRole] > roleHierarchy[targetUserRole] && 
    roleHierarchy[currentUserRole] >= 3 // Admin eller högre
  );
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
  const { colors } = useTheme();
  
  if (!colors) {
    console.warn('Theme colors are undefined in MemberItem');
    return null;
  }

  const [menuVisible, setMenuVisible] = useState(false);
  const RoleIcon = getRoleIcon(member.role);
  
  const handleMenuToggle = () => setMenuVisible(!menuVisible);
  
  const canModify = currentUserRole && !isCurrentUser && canModifyRole(currentUserRole, member.role);
  
  /**
   * Hantera förändring av en medlems roll
   * 
   * @param {TeamRole} newRole - Den nya rollen att tilldela medlemmen
   */
  const handleRoleChange = (newRole: TeamRole) => {
    if (!onChangeRole) return;
    
    Alert.alert(
      'Ändra roll',
      `Är du säker på att du vill ändra ${member.profile?.name || 'användarens'} roll till ${getRoleLabel(newRole)}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Bekräfta',
          onPress: async () => {
            try {
              await onChangeRole(member.id, newRole);
              setMenuVisible(false);
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte ändra roll. Försök igen senare.');
            }
          },
        },
      ]
    );
  };
  
  /**
   * Hantera borttagning av en medlem från teamet
   */
  const handleRemoveMember = () => {
    if (!onRemove) return;
    
    Alert.alert(
      'Ta bort medlem',
      `Är du säker på att du vill ta bort ${member.profile?.name || 'användaren'} från teamet?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemove(member.id);
              setMenuVisible(false);
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte ta bort medlem. Försök igen senare.');
            }
          },
        },
      ]
    );
  };
  
  /**
   * Hantera förändring av en medlems status
   * 
   * @param {TeamMember['status']} newStatus - Den nya statusen att tilldela medlemmen
   */
  const handleStatusChange = (newStatus: TeamMember['status']) => {
    if (!onStatusChange) return;
    
    Alert.alert(
      'Ändra status',
      `Är du säker på att du vill ändra ${member.profile?.name || 'användarens'} status till ${getStatusLabel(newStatus)}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Bekräfta',
          onPress: async () => {
            try {
              await onStatusChange(member.id, newStatus);
              setMenuVisible(false);
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte ändra status. Försök igen senare.');
            }
          },
        },
      ]
    );
  };
  
  // Generera menyn baserat på tillgängliga åtgärder
  const getMenuItems = () => {
    const items = [];
    
    if (onChangeRole && canModify) {
      // Endast visa rollalternativ som är tillgängliga baserat på användarens egen roll
      if (currentUserRole === 'owner' || currentUserRole === 'admin') {
        if (member.role !== 'admin') {
          items.push({ 
            label: 'Gör till Admin', 
            onPress: () => handleRoleChange('admin') 
          });
        }
        if (member.role !== 'moderator') {
          items.push({ 
            label: 'Gör till Moderator', 
            onPress: () => handleRoleChange('moderator') 
          });
        }
        if (member.role !== 'member') {
          items.push({ 
            label: 'Gör till Medlem', 
            onPress: () => handleRoleChange('member') 
          });
        }
      }
    }
    
    if (onStatusChange && canModify) {
      items.push({ 
        label: 'Ändra status', 
        onPress: () => handleStatusChange(member.status === 'active' ? 'inactive' : 'active')
      });
    }
    
    if (onRemove && canModify && member.role !== 'owner') {
      items.push({ 
        label: 'Ta bort från team', 
        onPress: handleRemoveMember,
        destructive: true 
      });
    }
    
    return items;
  };
  
  // Dynamiska stilar baserat på variant
  let containerStyle = styles.container;
  let infoStyle = styles.info;
  
  switch (variant) {
    case 'compact':
      containerStyle = styles.compactContainer;
      infoStyle = styles.compactInfo;
      break;
    case 'detailed':
      containerStyle = styles.detailedContainer;
      infoStyle = styles.detailedInfo;
      break;
    default:
      break;
  }
  
  const memberName = member.profile?.name || member.user?.email || 'Okänd användare';
  
  // Om allt ser bra ut, rendera komponenten
  return (
    <TouchableOpacity 
      style={containerStyle}
      onPress={onSelect ? () => onSelect(member) : undefined}
      disabled={!onSelect}
    >
      <View style={styles.content}>
        <Avatar
          size={variant === 'compact' ? 32 : 40}
          source={member.profile?.avatar_url}
          fallback={memberName[0] || '?'}
        />
        
        <View style={infoStyle}>
          <Text style={[styles.name, { color: colors.text.main }]}>
            {memberName}
            {member.role === 'owner' && !showRoleBadge && ' (Ägare)'}
          </Text>
          
          {showRoleLabel && member.role !== 'owner' && (
            <View style={styles.roleContainer}>
              <RoleIcon size={16} color={colors.text.light} />
              <Text style={[styles.role, { color: colors.text.secondary }]}>
                {getRoleLabel(member.role)}
              </Text>
            </View>
          )}
          
          {variant === 'detailed' && (
            <Text style={[styles.description, { color: colors.text.secondary }]}>
              {getRoleDescription(member.role)}
            </Text>
          )}
          
          <View style={styles.badges}>
            {showRoleBadge && (
              <Badge
                label={getRoleLabel(member.role)}
                color={colors.primary.main}
                size="small"
              />
            )}
            
            {showStatusBadge && (
              <Badge
                label={getStatusLabel(member.status)}
                color={getStatusColor(member.status, colors)}
                size="small"
              />
            )}
          </View>
        </View>
      </View>

      {showActions && getMenuItems().length > 0 && (
        <TouchableOpacity
          onPress={handleMenuToggle}
          style={styles.menuButton}
        >
          <MoreVertical size={20} color={colors.text.light} />
        </TouchableOpacity>
      )}

      <Menu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={getMenuItems()}
      />
    </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  detailedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  description: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
    fontFamily: 'Inter-Regular',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
});