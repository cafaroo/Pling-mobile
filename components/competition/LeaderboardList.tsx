import { View, Text, StyleSheet, Image } from 'react-native';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';

type LeaderboardEntry = {
  id: string;
  name: string;
  value: number;
  avatarUrl?: string;
  positionChange: number;
};

type LeaderboardListProps = {
  entries: LeaderboardEntry[];
  style?: object;
};

export default function LeaderboardList({ entries, style }: LeaderboardListProps) {
  const { colors } = useTheme();

  const renderPositionChange = (change: number) => {
    if (change > 0) {
      return <ChevronUp size={16} color={colors.success} />;
    } else if (change < 0) {
      return <ChevronDown size={16} color={colors.error} />;
    }
    return <Minus size={16} color={colors.neutral[400]} />;
  };

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          No participants yet
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {entries.map((entry, index) => {
        const isTopThree = index < 3;
        const positionColors = [
          colors.accent.yellow, // 1st place
          'silver',            // 2nd place
          '#CD7F32',          // 3rd place (bronze)
        ];
        
        return (
          <Card 
            key={entry.id}
            style={[
              styles.entryCard,
              isTopThree && { borderLeftColor: positionColors[index], borderLeftWidth: 4 }
            ]}
          >
            <View style={styles.rank}>
              <Text style={[
                styles.rankNumber, 
                { color: isTopThree ? positionColors[index] : colors.text.main }
              ]}>
                #{index + 1}
              </Text>
              <View style={styles.changeIndicator}>
                {renderPositionChange(entry.positionChange)}
              </View>
            </View>

            <View style={styles.userInfo}>
              {entry.avatarUrl ? (
                <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary.light }]}>
                  <Text style={styles.avatarInitial}>
                    {entry.name.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={[styles.userName, { color: colors.text.main }]}>
                {entry.name}
              </Text>
            </View>

            <Text style={[styles.value, { color: colors.accent.yellow }]}>
              {new Intl.NumberFormat('sv-SE').format(entry.value)} kr
            </Text>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  rank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  changeIndicator: {
    marginTop: 4,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
  userName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginLeft: 12,
  },
  value: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});