import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, ProgressBar, List, useTheme, Avatar, Divider, Chip, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { User } from '@/domain/user/entities/User';
import { UserStatisticType } from '@/domain/user/rules/statsCalculator';

interface UserStatsProps {
  /**
   * Användardata
   */
  user: User;
  
  /**
   * Statistikdata för användaren
   */
  statistics: Record<string, any>;
  
  /**
   * Om komponenten ska visa begränsad data
   */
  compact?: boolean;
  
  /**
   * Funktion som anropas när användaren klickar på en statistik
   */
  onStatClick?: (statType: string) => void;
}

/**
 * Komponent som visar användarstatistik
 */
export const UserStats: React.FC<UserStatsProps> = ({
  user,
  statistics,
  compact = false,
  onStatClick
}) => {
  const theme = useTheme();
  
  // Beräkna nivåframsteg för användaren
  const levelProgress = useMemo(() => {
    const currentLevel = statistics.level || 1;
    const points = statistics.points || 0;
    
    // Beräkna när nästa nivå nås
    const pointsForCurrentLevel = calculatePointsForLevel(currentLevel);
    const pointsForNextLevel = calculatePointsForLevel(currentLevel + 1);
    
    const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
    const pointsAboveCurrentLevel = points - pointsForCurrentLevel;
    
    return Math.min(pointsAboveCurrentLevel / pointsNeededForNextLevel, 0.99);
  }, [statistics.level, statistics.points]);
  
  // Generera en avatar-bakgrund baserat på användarens nivå
  const avatarBackground = useMemo(() => {
    const level = statistics.level || 1;
    
    // Olika bakgrunder beroende på nivå
    if (level >= 10) return theme.colors.primary;
    if (level >= 5) return theme.colors.secondary;
    return theme.colors.surfaceVariant;
  }, [statistics.level, theme.colors]);
  
  // Hantera klick på en statistik
  const handleStatClick = (statType: string) => {
    if (onStatClick) {
      onStatClick(statType);
    }
  };
  
  // Kompakt vy som visar endast de viktigaste statistiken
  if (compact) {
    return (
      <Card style={styles.compactCard}>
        <Card.Content style={styles.compactContent}>
          <View style={styles.levelContainer}>
            <Avatar.Text 
              size={40} 
              label={`${statistics.level || 1}`} 
              style={[styles.levelAvatar, { backgroundColor: avatarBackground }]}
            />
            <View style={styles.levelInfo}>
              <Text variant="titleMedium">Nivå {statistics.level || 1}</Text>
              <ProgressBar 
                progress={levelProgress} 
                color={theme.colors.primary}
                style={styles.progressBar} 
              />
            </View>
          </View>
          
          <View style={styles.compactStatsRow}>
            <View style={styles.compactStat}>
              <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
              <Text variant="bodySmall">{statistics.achievements || 0}</Text>
            </View>
            
            <View style={styles.compactStat}>
              <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
              <Text variant="bodySmall">{statistics.teams?.current || 0}</Text>
            </View>
            
            <View style={styles.compactStat}>
              <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
              <Text variant="bodySmall">{statistics.goals?.completion_rate || 0}%</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }
  
  // Fullständig vy
  return (
    <ScrollView>
      <Card style={styles.card}>
        <Card.Title title="Användarstatistik" />
        <Card.Content>
          {/* Nivå och framsteg */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <Avatar.Text 
                size={50} 
                label={`${statistics.level || 1}`} 
                style={[styles.levelAvatar, { backgroundColor: avatarBackground }]}
              />
              <View style={styles.levelDetails}>
                <Text variant="titleLarge">Nivå {statistics.level || 1}</Text>
                <Text variant="bodyMedium">
                  {statistics.points || 0} poäng totalt
                </Text>
                <ProgressBar 
                  progress={levelProgress} 
                  color={theme.colors.primary}
                  style={styles.progressBar} 
                />
                <Text variant="bodySmall">
                  {Math.round(levelProgress * 100)}% till nivå {(statistics.level || 1) + 1}
                </Text>
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Prestationer */}
          <List.Section>
            <List.Subheader>Prestationer</List.Subheader>
            <TouchableStatItem
              icon="trophy"
              title="Upplåsta prestationer"
              value={statistics.achievements || 0}
              onPress={() => handleStatClick(UserStatisticType.ACHIEVEMENTS_UNLOCKED)}
            />
            
            {/* Visa badges om de finns */}
            {statistics.badges && statistics.badges.length > 0 && (
              <View style={styles.badgesContainer}>
                {statistics.badges.slice(0, 5).map((badge: string, index: number) => (
                  <Chip key={index} style={styles.badge}>
                    {badge}
                  </Chip>
                ))}
                {statistics.badges.length > 5 && (
                  <Badge size={24}>+{statistics.badges.length - 5}</Badge>
                )}
              </View>
            )}
          </List.Section>
          
          <Divider style={styles.divider} />
          
          {/* Team-statistik */}
          <List.Section>
            <List.Subheader>Team</List.Subheader>
            <TouchableStatItem
              icon="account-group"
              title="Aktiva team"
              value={statistics.teams?.current || 0}
              onPress={() => handleStatClick(UserStatisticType.CURRENT_TEAMS)}
            />
            <TouchableStatItem
              icon="account-multiple-plus"
              title="Totalt antal anslutna team"
              value={statistics.teams?.joined || 0}
              onPress={() => handleStatClick(UserStatisticType.TEAMS_JOINED)}
            />
          </List.Section>
          
          <Divider style={styles.divider} />
          
          {/* Mål och tävlingar */}
          <List.Section>
            <List.Subheader>Mål och tävlingar</List.Subheader>
            <TouchableStatItem
              icon="flag"
              title="Skapade mål"
              value={statistics.goals?.created || 0}
              onPress={() => handleStatClick(UserStatisticType.GOALS_CREATED)}
            />
            <TouchableStatItem
              icon="check-all"
              title="Avklarade mål"
              value={statistics.goals?.completed || 0}
              onPress={() => handleStatClick(UserStatisticType.GOALS_COMPLETED)}
            />
            <TouchableStatItem
              icon="percent"
              title="Färdigställandegrad"
              value={`${statistics.goals?.completion_rate || 0}%`}
              onPress={() => handleStatClick('goals_completion_rate')}
            />
            <TouchableStatItem
              icon="medal"
              title="Tävlingar vunna"
              value={statistics.competitions?.won || 0}
              onPress={() => handleStatClick(UserStatisticType.COMPETITIONS_WON)}
            />
          </List.Section>
          
          <Divider style={styles.divider} />
          
          {/* Engagemang */}
          <List.Section>
            <List.Subheader>Engagemang</List.Subheader>
            <TouchableStatItem
              icon="fire"
              title="Aktivitetssvit"
              value={statistics.engagement?.activity_streak || 0}
              onPress={() => handleStatClick(UserStatisticType.ACTIVITY_STREAK)}
            />
            <TouchableStatItem
              icon="calendar-check"
              title="Dagar aktiv"
              value={statistics.engagement?.days_active || 0}
              onPress={() => handleStatClick(UserStatisticType.DAYS_ACTIVE)}
            />
          </List.Section>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

/**
 * Hjälpkomponent för en rad med statistik som är klickbar
 */
interface TouchableStatItemProps {
  icon: string;
  title: string;
  value: number | string;
  onPress?: () => void;
}

const TouchableStatItem: React.FC<TouchableStatItemProps> = ({
  icon,
  title,
  value,
  onPress
}) => {
  return (
    <List.Item
      title={title}
      right={() => <Text variant="bodyLarge">{value}</Text>}
      left={props => <List.Icon {...props} icon={icon} />}
      onPress={onPress}
      style={styles.listItem}
    />
  );
};

/**
 * Hjälpfunktion för att beräkna hur många poäng som krävs för en viss nivå
 */
const calculatePointsForLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  let points = 0;
  let currentLevel = 1;
  
  while (currentLevel < level) {
    points += currentLevel * 100;
    currentLevel++;
  }
  
  return points;
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4
  },
  compactCard: {
    margin: 8,
    elevation: 2
  },
  compactContent: {
    padding: 8
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  levelSection: {
    marginBottom: 16
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  levelAvatar: {
    marginRight: 12
  },
  levelDetails: {
    flex: 1
  },
  levelInfo: {
    flex: 1,
    marginLeft: 8
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8
  },
  divider: {
    marginVertical: 8
  },
  listItem: {
    paddingVertical: 4
  },
  compactStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8
  },
  compactStat: {
    alignItems: 'center'
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 8
  },
  badge: {
    margin: 4
  }
}); 