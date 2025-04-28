import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import { sv } from 'date-fns/locale';
import { differenceInDays } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { getCompetitionDetails, joinCompetition } from '@/services/competitionService';
import { getCompetitionRewards, getParticipantAchievements } from '@/services/rewardService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import CompetitionHeader from '@/components/competition/CompetitionHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import Tabs from '@/components/ui/Tabs';
import LeaderboardList from '@/components/competition/LeaderboardList';
import NotificationsList from '@/components/competition/NotificationsList';
import RewardsList from '@/components/competition/RewardsList';
import { Competition, CompetitionReward, CompetitionAchievement } from '@/types';

export default function CompetitionDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [rewards, setRewards] = useState<CompetitionReward[]>([]);
  const [achievements, setAchievements] = useState<CompetitionAchievement[]>([]);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === 'undefined') {
      router.replace('/competitions');
      return;
    }
  }, [id]);

  useEffect(() => {
    if (!id || id === 'undefined') {
      return;
    }
    loadCompetitionData();
  }, [id]);

  const loadCompetitionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [competitionData, rewardsData] = await Promise.all([
        getCompetitionDetails(id as string),
        getCompetitionRewards(id as string),
      ]);

      if (!competitionData) {
        setError('Competition not found');
        return;
      }

      setCompetition(competitionData);
      setRewards(rewardsData);

      if (competitionData?.participantId) {
        const achievementsData = await getParticipantAchievements(competitionData.participantId);
        setAchievements(achievementsData);
      }
    } catch (error) {
      console.error('Error loading competition data:', error);
      setError('Failed to load competition data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCompetition = async () => {
    try {
      setIsJoining(true);
      const success = await joinCompetition(id as string);
      if (success) {
        await loadCompetitionData();
      } else {
        setError('Failed to join competition');
      }
    } catch (error) {
      console.error('Error joining competition:', error);
      setError('Failed to join competition');
    } finally {
      setIsJoining(false);
    }
  };

  if (error) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Tävlingsdetaljer" icon={Trophy} onBackPress={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      </Container>
    );
  }

  if (isLoading || !competition) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Tävlingsdetaljer" icon={Trophy} onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Laddar tävling...
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
      <Header 
        title="Tävlingsdetaljer" 
        icon={Trophy} 
        onBackPress={() => router.back()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <CompetitionHeader competition={competition} />

        <Tabs
          tabs={[
            { id: 'leaderboard', label: 'Topplista' },
            { id: 'rewards', label: 'Belöningar' },
            { id: 'notifications', label: 'Notiser' },
          ]}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        {activeTab === 'leaderboard' && (
          <LeaderboardList
            entries={[
              {
                id: '1',
                name: 'Anna Andersson',
                value: 125000,
                avatarUrl: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300',
                positionChange: 2,
              },
              {
                id: '2',
                name: 'Erik Johansson',
                value: 98500,
                avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300',
                positionChange: -1,
              },
              {
                id: '3',
                name: 'Sofia Larsson',
                value: 87000,
                avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
                positionChange: 1,
              },
            ]}
            style={styles.tabContent}
          />
        )}

        {activeTab === 'rewards' && (
          <RewardsList
            rewards={rewards}
            achievements={achievements}
            style={styles.tabContent}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsList
            notifications={[
              {
                id: '1',
                competitionId: competition.id,
                participantId: '1',
                type: 'milestone',
                title: 'Ny milstolpe!',
                message: 'Du har nått 100 000 kr i försäljning',
                data: {},
                read: false,
                createdAt: new Date().toISOString(),
              },
              {
                id: '2',
                competitionId: competition.id,
                participantId: '1',
                type: 'rank_change',
                title: 'Ny position!',
                message: 'Du har klättrat till plats #2',
                data: {},
                read: true,
                createdAt: new Date(Date.now() - 3600000).toISOString(),
              },
            ]}
            style={styles.tabContent}
          />
        )}

        <Card style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: colors.text.main }]}>
            Tävlingsstatistik
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>
                Genomsnitt per dag
              </Text>
              <Text style={[styles.statValue, { color: colors.accent.yellow }]}>
                {new Intl.NumberFormat('sv-SE').format(
                  Math.round(competition.currentValue / 
                  Math.max(1, differenceInDays(new Date(), new Date(competition.startDate))))
                )} kr
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>
                Behövd takt per dag
              </Text>
              <Text style={[styles.statValue, { color: colors.accent.yellow }]}>
                {new Intl.NumberFormat('sv-SE').format(
                  Math.round((competition.targetValue - competition.currentValue) / 
                  Math.max(1, differenceInDays(new Date(competition.endDate), new Date())))
                )} kr
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>
                Procent av mål
              </Text>
              <Text style={[styles.statValue, { color: colors.accent.yellow }]}>
                {Math.round((competition.currentValue / competition.targetValue) * 100)}%
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text.light }]}>
                Kvar till mål
              </Text>
              <Text style={[styles.statValue, { color: colors.accent.yellow }]}>
                {new Intl.NumberFormat('sv-SE').format(
                  Math.max(0, competition.targetValue - competition.currentValue)
                )} kr
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statsCard: {
    padding: 20,
    marginTop: 24,
  },
  statsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  tabContent: {
    marginTop: 16,
  },
});