import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, Clock, Target, ChevronUp, ChevronDown, Minus } from 'lucide-react-native';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { getCompetitionDetails } from '@/services/competitionService';
import { getCompetitionRewards, getParticipantAchievements } from '@/services/rewardService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Tabs from '@/components/ui/Tabs';
import RewardsList from '@/components/competition/RewardsList';
import { Competition, CompetitionReward, CompetitionAchievement } from '@/types';

export default function CompetitionDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Redirect to competitions list if ID is undefined
  useEffect(() => {
    if (!id || id === 'undefined') {
      router.replace('/competitions');
      return;
    }
  }, [id]);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [rewards, setRewards] = useState<CompetitionReward[]>([]);
  const [achievements, setAchievements] = useState<CompetitionAchievement[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    
    const daysRemaining = differenceInDays(end, now);
    
    if (daysRemaining > 1) {
      return `${daysRemaining} dagar kvar`;
    } else if (daysRemaining === 1) {
      return '1 dag kvar';
    } else {
      const hoursRemaining = differenceInHours(end, now);
      return `${hoursRemaining} timmar kvar`;
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
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.headerCard}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              {competition.title}
            </Text>
            <View style={styles.typeContainer}>
              {competition.type === 'team' ? (
                <Users color={colors.accent.yellow} size={20} />
              ) : (
                <Trophy color={colors.accent.yellow} size={20} />
              )}
              <Text style={[styles.typeText, { color: colors.text.light }]}>
                {competition.type === 'team' ? 'Lagtävling' : 'Individuell tävling'}
              </Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.text.light }]}>
            {competition.description}
          </Text>

          <View style={styles.dateContainer}>
            <Clock size={16} color={colors.text.light} />
            <Text style={[styles.dateText, { color: colors.text.light }]}>
              {format(new Date(competition.startDate), 'd MMM')} - {format(new Date(competition.endDate), 'd MMM')}
              {' • '}
              {formatTimeRemaining(competition.endDate)}
            </Text>
          </View>

          {competition.prize && (
            <View style={[styles.prizeBadge, { backgroundColor: colors.accent.yellow }]}>
              <Text style={styles.prizeText}>
                {competition.prize}
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.rankContainer}>
              <Text style={[styles.rankLabel, { color: colors.text.light }]}>
                Din position
              </Text>
              <View style={styles.rankValue}>
                <Text style={[styles.rankNumber, { color: colors.accent.yellow }]}>
                  #{competition.currentPosition}
                </Text>
                <View style={styles.rankChange}>
                  {renderPositionChange(competition.positionChange)}
                </View>
              </View>
              <Text style={[styles.totalParticipants, { color: colors.text.light }]}>
                av {competition.totalParticipants} deltagare
              </Text>
            </View>

            <View style={styles.targetContainer}>
              <Target color={colors.accent.yellow} size={24} />
              <Text style={[styles.targetValue, { color: colors.text.main }]}>
                {new Intl.NumberFormat('sv-SE').format(competition.targetValue)} kr
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarHeader}>
              <Text style={[styles.progressLabel, { color: colors.text.light }]}>
                Din framgång
              </Text>
              <Text style={[styles.progressValue, { color: colors.accent.yellow }]}>
                {new Intl.NumberFormat('sv-SE').format(competition.currentValue)} kr
              </Text>
            </View>
            <ProgressBar
              progress={(competition.currentValue / competition.targetValue) * 100}
              height={8}
            />
          </View>
        </Card>

        <Tabs
          tabs={[
            { id: 'overview', label: 'Översikt' },
            { id: 'rewards', label: 'Belöningar' },
          ]}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        {activeTab === 'overview' ? (
          <Card style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: colors.text.main }]}>
              Statistik
            </Text>
            {/* Add competition statistics here */}
          </Card>
        ) : (
          <RewardsList
            rewards={rewards}
            achievements={achievements}
            style={styles.rewardsList}
          />
        )}
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
  headerCard: {
    padding: 20,
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 8,
  },
  prizeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  prizeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#1E1B4B',
  },
  progressCard: {
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  rankContainer: {
    alignItems: 'flex-start',
  },
  rankLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  rankValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
  },
  rankChange: {
    marginLeft: 8,
  },
  totalParticipants: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  targetContainer: {
    alignItems: 'flex-end',
  },
  targetValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginTop: 8,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  progressValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  statsCard: {
    padding: 20,
    marginTop: 16,
  },
  statsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  rewardsList: {
    marginTop: 16,
  },
});