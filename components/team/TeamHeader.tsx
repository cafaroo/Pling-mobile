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
import { ChevronDown, Check, Users } from 'lucide-react-native';
import { Team } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

interface TeamHeaderProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
  style?: ViewStyle;
}

export function TeamHeader({ teams, selectedTeam, onTeamSelect, style }: TeamHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownHeight = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const maxHeight = 300;
  const hasSingleTeam = teams.length === 1;

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
      console.log('Selecting team:', team.name); // Debug log
      onTeamSelect(team);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (teams.length > 1) {
      setIsOpen(!isOpen);
    }
  };

  const dynamicStyles = {
    selectedTeamItemText: {
      color: colors.accent.yellow,
    },
    teamSelectorContainer: {
      backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    }
  };

  const renderSingleTeamHeader = () => (
    <View style={[styles.teamSelectorContainer]}>
      <View style={styles.teamSelector}>
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, { color: colors.text.main }]}>
            {teams[0]?.name || 'Ditt team'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTeamSelector = () => (
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
        {!isOpen && (
          <View style={[styles.teamCount, { backgroundColor: colors.accent.yellow }]}>
            <Text style={[styles.teamCountText, { color: colors.background.dark }]}>
              {teams.length}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }, style]}>
      {hasSingleTeam ? renderSingleTeamHeader() : renderTeamSelector()}
      
      {selectedTeam?.description && (
        <Text style={[styles.description, { color: colors.text.light }]}>
          {selectedTeam.description}
        </Text>
      )}

      {!hasSingleTeam && (
        <>
          <Animated.View style={[
            styles.dropdownContainer,
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
            <BlurView intensity={20} style={styles.blurContainer}>
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
              </ScrollView>
            </BlurView>
          </Animated.View>

          {isOpen && (
            <Pressable 
              style={styles.backdrop}
              onPress={() => setIsOpen(false)}
            />
          )}
        </>
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
  teamSelectorContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
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
    marginLeft: 12,
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
    position: 'absolute',
    top: '100%',
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5, // För Android
    shadowColor: '#000', // För iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: 300,
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
}); 