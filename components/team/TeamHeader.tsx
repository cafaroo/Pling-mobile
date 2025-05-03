import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ViewStyle, 
  Animated, 
  Easing,
  ScrollView,
  Pressable 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDown, Check, Users, Plus, UserPlus } from 'lucide-react-native';
import { Team, TeamRole } from '@/types/team';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface TeamHeaderProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
  style?: ViewStyle;
  userRole?: TeamRole;
}

export function TeamHeader({ teams, selectedTeam, onTeamSelect, style, userRole }: TeamHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const maxHeight = 400; // Ökat för att ge plats för de nya alternativen

  const rotateIcon = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dropdownHeight, {
        toValue: isOpen ? maxHeight : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false
      }),
      Animated.timing(rotation, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, [isOpen]);

  const handleTeamSelect = (team: Team) => {
    if (team.id !== selectedTeam?.id) {
      onTeamSelect(team);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCreateTeam = () => {
    setIsOpen(false);
    router.push('/team/create');
  };

  const handleJoinTeam = () => {
    setIsOpen(false);
    router.push('/team/join');
  };

  const dynamicStyles = {
    selectedTeamItemText: {
      color: colors.accent.yellow,
    },
    teamSelectorContainer: {
      backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    },
    dropdownContainer: {
      backgroundColor: colors.background.dark,
      position: 'absolute',
      top: '100%',
      left: 20,
      right: 20,
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 1000,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }, style]}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={[styles.teamSelectorContainer, dynamicStyles.teamSelectorContainer]}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <View style={styles.teamSelector}>
            <View style={styles.teamInfo}>
              <Text style={[styles.teamLabel, { color: colors.text.light }]}>
                {selectedTeam ? 'Aktivt team' : 'Dina team'}
              </Text>
              <View style={styles.teamNameContainer}>
                <Text style={[styles.teamName, { color: colors.text.main }]}>
                  {selectedTeam?.name || 'Välj team'}
                </Text>
                <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                  <ChevronDown 
                    size={20} 
                    color={colors.text.light}
                    style={styles.icon} 
                  />
                </Animated.View>
              </View>
            </View>
            {!isOpen && teams.length > 0 && (
              <View style={[styles.teamCount, { backgroundColor: colors.accent.yellow }]}>
                <Text style={[styles.teamCountText, { color: colors.background.dark }]}>
                  {teams.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      {selectedTeam?.description && (
        <Text style={[styles.description, { color: colors.text.light }]}>
          {selectedTeam.description}
        </Text>
      )}

      {isOpen && (
        <Animated.View style={[
          styles.dropdownContainer,
          dynamicStyles.dropdownContainer,
          {
            maxHeight: dropdownHeight,
            opacity: opacity,
            transform: [{
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <Pressable
                  key={team.id}
                  style={({ pressed }) => [
                    styles.teamItem,
                    isSelected && styles.selectedTeamItem,
                    pressed && styles.pressedTeamItem
                  ]}
                  onPress={() => handleTeamSelect(team)}
                >
                  <View style={styles.teamItemContent}>
                    <Users 
                      size={16} 
                      color={isSelected ? colors.accent.yellow : colors.text.light} 
                      style={styles.teamItemIcon} 
                    />
                    <Text style={[
                      styles.teamItemName, 
                      { color: colors.text.main },
                      isSelected && dynamicStyles.selectedTeamItemText
                    ]}>
                      {team.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color={colors.accent.yellow} />
                  )}
                </Pressable>
              );
            })}

            <View style={styles.divider} />

            {userRole === 'owner' && (
              <Pressable
                style={({ pressed }) => [
                  styles.teamItem,
                  pressed && styles.pressedTeamItem
                ]}
                onPress={handleCreateTeam}
              >
                <View style={styles.teamItemContent}>
                  <Plus 
                    size={16} 
                    color={colors.text.light}
                    style={styles.teamItemIcon} 
                  />
                  <Text style={[styles.teamItemName, { color: colors.text.main }]}>
                    Skapa nytt team
                  </Text>
                </View>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.teamItem,
                pressed && styles.pressedTeamItem,
                !userRole || userRole !== 'owner' ? styles.lastItem : null
              ]}
              onPress={handleJoinTeam}
            >
              <View style={styles.teamItemContent}>
                <UserPlus 
                  size={16} 
                  color={colors.text.light}
                  style={styles.teamItemIcon} 
                />
                <Text style={[styles.teamItemName, { color: colors.text.main }]}>
                  Gå med i team
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </Animated.View>
      )}

      {isOpen && (
        <Pressable 
          style={styles.backdrop}
          onPress={() => setIsOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSelectorContainer: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  teamSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamInfo: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
    opacity: 0.7,
  },
  teamNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  teamCount: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  teamCountText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    opacity: 0.7,
  },
  icon: {
    marginLeft: 8,
  },
  dropdownContainer: {
    maxHeight: 400,
  },
  scrollView: {
    maxHeight: 400,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamItemIcon: {
    marginRight: 12,
  },
  selectedTeamItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pressedTeamItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamItemName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  divider: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
}); 