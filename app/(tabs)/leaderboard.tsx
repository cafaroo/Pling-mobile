import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Trophy, ChevronUp, ChevronDown, Minus, Target, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { getLeaderboard } from '@/services/leaderboardService';
import { getTeamRanking } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import { LeaderboardEntry, TeamRanking } from '@/types';

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teamRanking, setTeamRanking] = useState<TeamRanking | null>(null);
  const [activeTab, setActiveTab] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  
  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeaderboard(activeTab);
      setIsEmpty(!data || data.length === 0);
      setLeaderboard(data);
      
      // Get team ranking if available
      if (user?.team?.id) {
        const ranking = await getTeamRanking(user.team.id);
        setTeamRanking(ranking);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Could not load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPositionChange = (change: number) => {
    if (change > 0) {
      return <ChevronUp size={16} color={colors.success} />;
    } else if (change < 0) {
      return <ChevronDown size={16} color={colors.error} />;
    }
    return <Minus size={16} color={colors.neutral[400]} />;
  };

  const getDateLabel = () => {
    const today = new Date();
    if (activeTab === 'week') {
      return `Vecka ${format(today, 'w', { locale: sv })}`;
    } else if (activeTab === 'month') {
      return format(today, 'MMMM yyyy', { locale: sv });
    }
    return format(today, 'yyyy', { locale: sv });
  };

  if (error) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Topplista" icon={Trophy} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Topplista" icon={Trophy} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Laddar topplista...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header title="Topplista" icon={Trophy} />
      
      <View style={styles.content}>
        <Tabs
          tabs={[
            { id: 'week', label: 'Vecka' },
            { id: 'month', label: 'Månad' },
            { id: 'year', label: 'År' },
          ]}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />
        
        <Text style={[styles.periodLabel, { color: colors.text.light }]}>
          {getDateLabel()}
        </Text>
        
        {teamRanking && (
          <Card style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.teamInfo}>
                <Users color={colors.accent.yellow} size={24} />
                <Text style={[styles.teamTitle, { color: colors.text.main }]}>
                  {teamRanking.teamName}
                </Text>
              </View>
              <View style={styles.teamStats}>
                <View style={styles.teamRank}>
                  <Text style={[styles.teamRankText, { color: colors.accent.yellow }]}>
                    #{teamRanking.rank}
                  </Text>
                  <View style={styles.changeIndicator}>
                    {renderPositionChange(teamRanking.positionChange)}
                  </View>
                </View>
                <Text style={[styles.teamAmount, { color: colors.text.light }]}>
                  {new Intl.NumberFormat('sv-SE').format(teamRanking.totalAmount)} kr
                </Text>
              </View>
            </View>
            
            <View style={styles.teamTargets}>
              <View style={styles.targetItem}>
                <Target size={16} color={colors.text.light} />
                <Text style={[styles.targetText, { color: colors.text.light }]}>
                  Veckans mål: {new Intl.NumberFormat('sv-SE').format(150000)} kr
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.neutral[700] }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.accent.yellow,
                      width: `${Math.min((teamRanking.totalAmount / 150000) * 100, 100)}%`
                    }
                  ]} 
                />
              </View>
            </View>
          </Card>
        )}
        
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {isEmpty ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary.light }]}>
                <Trophy size={48} color={colors.accent.yellow} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text.main }]}>
                Här var det tomt!
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.light }]}>
                Inga försäljningar har registrerats under denna period. Gör din första PLING! för att komma med på topplistan.
              </Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => {
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
                          {entry.name?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.userName, { color: colors.text.main }]}>
                      {entry.name || 'Unknown User'}
                    </Text>
                  </View>

                  <Text style={[styles.amount, { color: colors.accent.yellow }]}>
                    {new Intl.NumberFormat('sv-SE').format(entry.amount)} kr
                  </Text>
                </Card>
              );
            })
          )}
        </ScrollView>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  periodLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  teamCard: {
    marginBottom: 24,
    padding: 20,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamRankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  teamAmount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 4,
  },
  teamTargets: {
    marginTop: 8,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  targetText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
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
  amount: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },
});