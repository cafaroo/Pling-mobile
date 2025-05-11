import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@context/ThemeContext';
import { Team } from '@types/team';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';

interface TeamCardProps {
  team: Team;
  onPress?: () => void;
  style?: ViewStyle;
}

export const TeamCard: React.FC<TeamCardProps> = React.memo(({ 
  team, 
  onPress, 
  style 
}) => {
  const { colors } = useTheme();
  
  const activeMembers = team.team_members?.filter(
    member => member.status === 'active'
  ).length || 0;

  return (
    <Card style={[styles.container, style]}>
      <TouchableOpacity 
        onPress={onPress}
        disabled={!onPress}
        style={styles.touchable}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {team.profile_image ? (
                <Avatar 
                  size={40} 
                  source={team.profile_image}
                  fallback={team.name}
                />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: colors.primary.light }]}>
                  <Users size={24} color={colors.accent.yellow} />
                </View>
              )}
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text.main }]}>
                  {team.name}
                </Text>
                <Text style={[styles.memberCount, { color: colors.text.light }]}>
                  {activeMembers} {activeMembers === 1 ? 'medlem' : 'medlemmar'}
                </Text>
              </View>
            </View>
            <ChevronRight size={24} color={colors.text.light} />
          </View>
          
          {team.description && (
            <Text 
              style={[styles.description, { color: colors.text.light }]}
              numberOfLines={2}
            >
              {team.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  touchable: {
    width: '100%',
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  memberCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});

export default TeamCard; 