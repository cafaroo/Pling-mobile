import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Team } from '@/types/team';
import { Users, Lock, Globe, ChevronRight } from 'lucide-react-native';
import { Badge } from './Badge';

/**
 * Props för TeamCard-komponenten
 * 
 * @interface TeamCardProps
 * @property {Team} team - Teamet som ska visas
 * @property {() => void} onPress - Callback som anropas när kortet klickas
 * @property {boolean} [isSelected] - Om kortet är markerat
 * @property {boolean} [showMemberCount] - Om antal medlemmar ska visas
 * @property {boolean} [showPrivacy] - Om sekretessindikator ska visas
 * @property {'compact' | 'default' | 'detailed'} [variant] - Visningsvariant av komponenten
 */
interface TeamCardProps {
  team: Team;
  onPress: () => void;
  isSelected?: boolean;
  showMemberCount?: boolean;
  showPrivacy?: boolean;
  variant?: 'compact' | 'default' | 'detailed';
}

/**
 * Kort som visar teaminformation med visuell representation
 * 
 * Komponenten stöder olika visningsvarianter och innehåller information
 * om teamets namn, bild, medlemsantal och sekretessinställningar.
 * 
 * @param {TeamCardProps} props - Komponentens props
 * @returns {React.ReactElement} Renderat teamkort
 * 
 * @example
 * <TeamCard 
 *   team={team}
 *   onPress={() => navigation.navigate('Team', { teamId: team.id })}
 *   isSelected={selectedTeamId === team.id}
 *   showMemberCount
 *   showPrivacy
 * />
 */
export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onPress,
  isSelected = false,
  showMemberCount = true,
  showPrivacy = true,
  variant = 'default'
}) => {
  const { colors } = useTheme();
  
  // Generera fallback-avatar om ingen profilbild finns
  const generateInitialAvatar = () => {
    const initials = team.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
      
    return (
      <View style={[
        styles.avatarFallback, 
        { backgroundColor: colors.primary.light }
      ]}>
        <Text style={[styles.avatarInitials, { color: colors.primary.dark }]}>
          {initials}
        </Text>
      </View>
    );
  };
  
  // Antal medlemmar (om tillgängligt)
  const memberCount = team.team_members?.length || 0;
  
  // Avgör om teamet är privat baserat på inställningar
  const isPrivate = !team.settings?.privacy?.isPublic;
  
  // Renderar olika varianter av komponenten
  const renderContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <View style={[
            styles.container, 
            styles.compactContainer,
            isSelected && { borderColor: colors.primary.main }
          ]}>
            <View style={styles.avatarContainer}>
              {team.profile_image ? (
                <Image 
                  source={{ uri: team.profile_image }} 
                  style={styles.avatar} 
                />
              ) : generateInitialAvatar()}
            </View>
            
            <View style={styles.compactDetails}>
              <Text 
                style={[styles.teamName, { color: colors.text.main }]}
                numberOfLines={1}
              >
                {team.name}
              </Text>
              
              {showPrivacy && (
                <View style={styles.privacyIcon}>
                  {isPrivate ? (
                    <Lock size={14} color={colors.text.light} />
                  ) : (
                    <Globe size={14} color={colors.text.light} />
                  )}
                </View>
              )}
            </View>
          </View>
        );
      
      case 'detailed':
        return (
          <View style={[
            styles.container, 
            styles.detailedContainer,
            isSelected && { borderColor: colors.primary.main }
          ]}>
            <ImageBackground
              source={team.profile_image ? { uri: team.profile_image } : undefined}
              style={styles.headerBackground}
              imageStyle={{ opacity: 0.5 }}
            >
              <View style={[styles.headerOverlay, { backgroundColor: colors.background.dark }]} />
              <View style={styles.detailedHeader}>
                <View style={styles.avatarContainer}>
                  {team.profile_image ? (
                    <Image 
                      source={{ uri: team.profile_image }} 
                      style={styles.avatarLarge} 
                    />
                  ) : generateInitialAvatar()}
                </View>
                
                <View style={styles.headerContent}>
                  <Text 
                    style={[styles.teamNameLarge, { color: colors.text.main }]}
                    numberOfLines={1}
                  >
                    {team.name}
                  </Text>
                  
                  <View style={styles.badgeContainer}>
                    {showPrivacy && (
                      <Badge
                        text={isPrivate ? 'Privat' : 'Offentlig'}
                        color={isPrivate ? colors.warning : colors.success}
                        icon={isPrivate ? Lock : Globe}
                        variant="small"
                      />
                    )}
                    
                    {showMemberCount && (
                      <Badge
                        text={`${memberCount} ${memberCount === 1 ? 'medlem' : 'medlemmar'}`}
                        color={colors.secondary.light}
                        icon={Users}
                        variant="small"
                      />
                    )}
                  </View>
                </View>
              </View>
            </ImageBackground>
            
            {team.description && (
              <Text 
                style={[styles.description, { color: colors.text.light }]}
                numberOfLines={2}
              >
                {team.description}
              </Text>
            )}
          </View>
        );
      
      default: // 'default'
        return (
          <View style={[
            styles.container, 
            styles.defaultContainer,
            isSelected && { borderColor: colors.primary.main }
          ]}>
            <View style={styles.mainContent}>
              <View style={styles.avatarContainer}>
                {team.profile_image ? (
                  <Image 
                    source={{ uri: team.profile_image }} 
                    style={styles.avatar} 
                  />
                ) : generateInitialAvatar()}
              </View>
              
              <View style={styles.details}>
                <Text 
                  style={[styles.teamName, { color: colors.text.main }]}
                  numberOfLines={1}
                >
                  {team.name}
                </Text>
                
                <View style={styles.badgeRow}>
                  {showMemberCount && (
                    <View style={styles.countBadge}>
                      <Users size={14} color={colors.text.light} />
                      <Text style={[styles.countText, { color: colors.text.light }]}>
                        {memberCount}
                      </Text>
                    </View>
                  )}
                  
                  {showPrivacy && (
                    <View style={styles.privacyBadge}>
                      {isPrivate ? (
                        <Lock size={14} color={colors.text.light} />
                      ) : (
                        <Globe size={14} color={colors.text.light} />
                      )}
                      <Text style={[styles.privacyText, { color: colors.text.light }]}>
                        {isPrivate ? 'Privat' : 'Offentlig'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <ChevronRight size={20} color={colors.text.light} />
          </View>
        );
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.touchable,
        isSelected && { backgroundColor: colors.background.selected }
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginVertical: 4,
    borderRadius: 8,
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 60,
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 76,
  },
  detailedContainer: {
    height: 'auto',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  compactDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    fontSize: 13,
    marginLeft: 4,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    marginLeft: 4,
  },
  privacyIcon: {
    padding: 4,
  },
  headerBackground: {
    height: 120,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  detailedHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    padding: 16,
    paddingTop: 0,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
}); 